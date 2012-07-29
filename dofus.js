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
  var AUTH_ADDRESS, AUTH_PORT, DOFUS_VERSION, DATABASE_USER, DATABASE_PASSWORD, DATABASE_DB, net, mysql, AuthNetServer, AuthNetClient, Account, Utils, ConnectDatabase, AuthServer, Main, WritePlatformInformations, StartDatabaseServices, StartNetWorkServices, __split = ''.split, __replace = ''.replace;
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
    function AuthNetClient(socket){
      this.socket = socket;
      this.encryptKey = Utils.GenerateString(32);
      this.send("HC" + this.encryptKey);
      (function(){
        this('close', this.onClose);
        this('data', this.onReceiveData);
        this('error', function(it){
          console.log("error : " + it);
        });
      }.call(this.socket.on));
    }
    prototype.send = function(it){
      console.log("Send packet " + it);
      this.socket.write(it + "\x00");
    };
    prototype.onReceiveData = function(event){
      var data, x, __i, __len;
      data = Utils.CleanPacket(event.toString());
      for (__i = 0, __len = data.length; __i < __len; ++__i) {
        x = data[__i];
        AuthNetClient.handlePacket(x);
      }
    };
    prototype.onClose = function(){
      console.log('Client disconnected');
    };
    prototype.handlePacket = function(packet){
      if ("" !== packet && packet !== "Af") {
        console.log("Received packet <= " + packet);
        switch (AuthNetClient.state) {
        case 0:
          AuthNetClient.checkVersion(packet);
          break;
        case 1:
          AuthNetClient.checkAccount(packet);
        }
      }
    };
    prototype.checkVersion = function(it){
      if (it === DOFUS_VERSION) {
        return AuthNetClient.state = 1;
      } else {
        AuthNetClient.state = -1;
        return AuthNetClient.send("AlEv" + DOFUS_VERSION);
      }
    };
    prototype.checkAccount = function(it){
      var username, password, account, __ref;
      AuthNetClient.state = -1;
      __ref = __split.call(it, '#1'), username = __ref[0], password = __ref[1];
      account = Account.findByUsername(username);
      if (account.password === password) {
        console.log('account ok');
      } else {}
    };
    return AuthNetClient;
  }());
  Account = (function(){
    Account.displayName = 'Account';
    var prototype = Account.prototype, constructor = Account;
    prototype.id = -1;
    prototype.username = "";
    prototype.password = "";
    Account.byId = [];
    Account.byUsername;
    function Account(__arg){
      this.id = __arg.id, this.username = __arg.username, this.password = __arg.password;
    }
    prototype.GetMd5Password = function(cipher){};
    Account.findBy = __curry(function(prop, value, callback){
      var account, query;
      account = null;
      query = "SELECT * FROM accounts WHERE " + prop + "=?";
      return mysql.execute(query, [value]).addListener('row', function(it){
        var account, prop, __i, __ref, __len;
        account = new Account(it);
        if (typeof callback === 'function') {
          callback(account);
        }
        for (__i = 0, __len = (__ref = ['Id', 'Username']).length; __i < __len; ++__i) {
          prop = __ref[__i];
          Account["by" + prop][account[prop]] = account;
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
    Utils.GenerateString = function(lenght){
      var rndStr, i;
      rndStr = "";
      for (i = 1; i <= lenght; ++i) {
        rndStr += Utils.Hash.charAt(Utils.RandNumber(0, 25));
      }
      return rndStr;
    };
    Utils.CleanPacket = function(packet){
      return (__replace.call(packet, "\x0a", '').replace("\n", '')).split("\x00");
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
  Main = function(){
    WritePlatformInformations();
    StartDatabaseServices();
    StartNetWorkServices();
    return Account.findByUsername('test');
  };
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
  function __curry(f, args){
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      return params.push.apply(params, arguments) < f.length && arguments.length ?
        __curry.call(this, f, params) : f.apply(this, params);
    } : f;
  }
}).call(this);
