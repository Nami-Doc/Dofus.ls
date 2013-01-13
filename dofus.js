/*
Ce fichier est une partie du projet Dofus.ls

Dofus.ls est un logiciel libre : vous pouvez redistribué et/ou modifié
les sources sous les thermes de la General Public License (GNU) publié par
la Free Software Foundation, ou bien de la version 3 de la license ou tout
autre version antérieur.

Dofus.coffee est distribué dans la volonté d'être utile SANS AUCUNE GARANTIE, 
néanmoins en aucun cas il ne doit pas ETRE UTILISE OU DISTRIBUE A DES FINS COMMERCIALES,
voir la General Public License (GNU) pour plus de détails.

Un copie de la General Public License (GNU) est distribué avec le logiciel Dofus.coffee
En cas contraire visitez : <http://www.gnu.org/licenses/>.

Dofus.coffee Copyright (C) 2010 NightWolf & Dofus.coffee Team — Tous droits réservés.
Créé par NightWolf
Fork ls par Vendethiel
*/
(function(){
  var AUTH_ADDRESS, AUTH_PORT, DOFUS_VERSION, DATABASE_USER, DATABASE_PASSWORD, DATABASE_DB, net, mysql, AuthNetServer, AuthNetClient, Account, Utils, ConnectDatabase, AuthServer, WritePlatformInformations, StartDatabaseServices, StartNetWorkServices, split$ = ''.split, replace$ = ''.replace;
  AUTH_ADDRESS = "127.0.0.1";
  AUTH_PORT = 444;
  DOFUS_VERSION = "1.29.1";
  DATABASE_USER = "root";
  DATABASE_PASSWORD = "";
  DATABASE_DB = "arkalia_realm";
  net = require('net');
  mysql = require('mysql-native').createTCPClient();
  AuthNetServer = (function(){
    AuthNetServer.displayName = 'AuthNetServer';
    var prototype = AuthNetServer.prototype, constructor = AuthNetServer;
    function AuthNetServer(ip, port){
      this.ip = ip;
      this.port = port;
      this.onConnection = bind$(this, 'onConnection', prototype);
      this.server = net.createServer(this.onConnection);
    }
    prototype.start = function(){
      return this.server.listen(AUTH_PORT, AUTH_ADDRESS);
    };
    prototype.onConnection = function(event){
      var client;
      console.log('New input connection on authserver');
      event.pipe(event);
      return client = new AuthNetClient(event);
    };
    return AuthNetServer;
  }());
  AuthNetClient = (function(){
    AuthNetClient.displayName = 'AuthNetClient';
    var prototype = AuthNetClient.prototype, constructor = AuthNetClient;
    prototype.state = 0;
    prototype.stateHandlers = ["Version", "Account"];
    function AuthNetClient(socket){
      var x$;
      this.socket = socket;
      this.checkAccount = bind$(this, 'checkAccount', prototype);
      this.checkVersion = bind$(this, 'checkVersion', prototype);
      this.handlePacket = bind$(this, 'handlePacket', prototype);
      this.onClose = bind$(this, 'onClose', prototype);
      this.onReceiveData = bind$(this, 'onReceiveData', prototype);
      this.encryptKey = Utils.GenerateString(32);
      this.send("HC" + this.encryptKey);
      x$ = this.socket;
      x$.on('close', this.onClose);
      x$.on('data', this.onReceiveData);
      x$.on('error', function(it){
        console.log("error : " + it);
      });
    }
    prototype.send = function(it){
      console.log("Send packet " + it);
      this.socket.write(it + "\x00");
    };
    prototype.onReceiveData = function(event){
      var data, i$, len$, x;
      data = Utils.CleanPacket(event.toString());
      for (i$ = 0, len$ = data.length; i$ < len$; ++i$) {
        x = data[i$];
        this.handlePacket(x);
      }
    };
    prototype.onClose = function(){
      console.log('Client disconnected');
    };
    prototype.handlePacket = function(packet){
      if (packet == "" || packet == "Af") {
        return;
      }
      console.log("Received packet " + packet);
      this[stateHandlers[this.state]](packet);
    };
    prototype.checkVersion = function(it){
      if (it === DOFUS_VERSION) {
        return this.state = 1;
      } else {
        this.state = -1;
        return this.send("AlEv" + DOFUS_VERSION);
      }
    };
    prototype.checkAccount = function(it){
      var ref$, username, password;
      this.state = -1;
      ref$ = split$.call(it, '#1'), username = ref$[0], password = ref$[1];
      Account.findByUsername(username, function(account){
        this.account = account;
        if (this.account.password === password) {
          return console.log("account ok - logged with id " + this.account.id);
        } else {
          throw Error('unimplemented');
        }
      });
    };
    return AuthNetClient;
  }());
  Account = (function(){
    Account.displayName = 'Account';
    var prototype = Account.prototype, constructor = Account;
    function Account(arg$){
      this.id = arg$.id, this.username = arg$.username, this.password = arg$.password;
    }
    prototype.getMd5Password = function(cipher){};
    Account.findBy = curry$(function(prop, value, callback){
      var that, ref$, account, query;
      if (that = (ref$ = this["by" + prop]) != null ? ref$[value] : void 8) {
        return that;
      }
      account = null;
      query = "SELECT * FROM accounts WHERE " + prop + "=?";
      return mysql.execute(query, [value]).addListener('row', function(it){
        var account, i$, ref$, len$, prop, key$;
        account = new Account(it);
        if (typeof callback === 'function') {
          callback(account);
        }
        for (i$ = 0, len$ = (ref$ = ['Id', 'Username']).length; i$ < len$; ++i$) {
          prop = ref$[i$];
          (this[key$ = "by" + prop] || (this[key$] = []))[account[prop]] = account;
        }
      });
    });
    Account.findByUsername = Account.findBy('Username');
    return Account;
  }());
  Utils = (function(){
    Utils.displayName = 'Utils';
    var prototype = Utils.prototype, constructor = Utils;
    Utils.Hash = 'azertyuiopqsdfghjklmwxcvbn';
    Utils.RandNumber = function(min, max){
      return min + Math.floor(Math.random() * (max - min + 1));
    };
    Utils.GenerateString = function(length){
      return (function(){
        var i$, to$, results$ = [];
        for (i$ = 0, to$ = length - 1; i$ <= to$; ++i$) {
          results$.push(this.Hash.charAt(this.RandNumber(0, 25)));
        }
        return results$;
      }.call(this)).join('');
    };
    Utils.CleanPacket = function(packet){
      return (replace$.call(packet, "\x0a", '').replace("\n", '')).split("\x00");
    };
    function Utils(){}
    return Utils;
  }());
  ConnectDatabase = function(){
    mysql.auto_prepare = true;
    mysql.auth(DATABASE_DB, DATABASE_USER, DATABASE_PASSWORD);
    return console.log('Connected to database !');
  };
  AuthServer = null;
  function Main(){
    WritePlatformInformations();
    StartDatabaseServices();
    StartNetWorkServices();
    Account.findByUsername('test');
  }
  WritePlatformInformations = function(){
    console.log("Your node.js details:");
    console.log("Version: " + process.version);
    console.log("Platform: " + process.platform);
    return console.log("Architecture: " + process.arch);
  };
  StartDatabaseServices = function(){
    console.log('Starting database services ...');
    return ConnectDatabase();
  };
  StartNetWorkServices = function(){
    var AuthServer;
    console.log('Starting network services ...');
    AuthServer = new AuthNetServer(AUTH_ADRESS, AUTH_PORT);
    return AuthServer.start();
  };
  Main();
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
}).call(this);
