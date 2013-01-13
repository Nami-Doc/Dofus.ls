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
const AUTH_ADDRESS = "127.0.0.1", AUTH_PORT = 444

const DOFUS_VERSION = "1.29.1"

const DATABASE_USER = "root", DATABASE_PASSWORD = "", DATABASE_DB = "arkalia_realm"


require! {net, mysql: 'mysql-native'createTCPClient!}


# Network class
class AuthNetServer
	(@ip, @port) ->
		@server = net.createServer @on-connection

	start: ->
		@server.listen AUTH_PORT, AUTH_ADDRESS

	on-connection: (event) ~>
		console.log 'New input connection on authserver'
		event.pipe event
		client = new AuthNetClient event

class AuthNetClient
	state: 0

	state-handlers:
		"Version"
		"Account"

	(@socket) ->
		@encryptKey = Utils.GenerateString 32
		@send "HC#{@encryptKey}"
		
		@socket
			..on 'close' @on-close
			..on 'data' @on-receive-data
			..on 'error' !-> console.log "error : #it"

	send: !->
		console.log "Send packet #it"
		@socket.write "#it\x00"

	on-receive-data: !(event) ~>
		data = Utils.CleanPacket event.toString!

		[@handlePacket x for x in data]

	on-close: !~>
		console.log 'Client disconnected'

	handle-packet: !(packet) ~>
		return if packet in ["" "Af"]

		console.log "Received packet #packet"
		@[state-handlers[@state]] packet


	checkVersion: ~> #Check client version
		if it is DOFUS_VERSION
			@state = 1
		else #required version
			@state = -1
			@send "AlEv#DOFUS_VERSION"

	checkAccount: !~> #Check client account requested
		@state = -1
		[username, password] = it / '#1'
		@account <- Account.findByUsername username
		if @account.password is password
			# account is OK
			console.log "account ok - logged with id #{@account.id}"
		else ...


# Client methods
class Account	
	({@id, @username, @password}) ->
	
	getMd5Password: (cipher) ->
	
	@findBy = (prop, value, callback) -->
		if @["by#prop"]?[value] then return that

		account = null
		
		query = "SELECT * FROM accounts WHERE #prop=?"
		mysql.execute query, [value] .addListener 'row' !->
			account = new Account it
			
			callback? account
			[@[]["by#prop"][account[prop]] = account for prop in <[Id Username]>]

	@findByUsername = @findBy 'Username'

# Utilities methods
class Utils
	@Hash = 'azertyuiopqsdfghjklmwxcvbn'

	@RandNumber = (min, max) ->
		min + Math.floor Math.random! * (max - min + 1)

	@GenerateString = (length) ->
		[@Hash.charAt @RandNumber 0 25 for to length-1] * ''

	@CleanPacket = (packet) ->
		(packet - "\x0a" - "\n") / "\x00"



		
# Database Methods
ConnectDatabase = ->
	mysql.auto_prepare = true
	mysql.auth DATABASE_DB, DATABASE_USER, DATABASE_PASSWORD
	console.log 'Connected to database !'




# Start Program Methods
AuthServer = null

!function Main
	WritePlatformInformations!
	StartDatabaseServices!
	StartNetWorkServices!
	Account.findByUsername 'test'

WritePlatformInformations = ->
	console.log "Your node.js details:"
	console.log "Version: #{process.version}"
	console.log "Platform: #{process.platform}"
	console.log "Architecture: #{process.arch}"

StartDatabaseServices = ->
	console.log 'Starting database services ...'
	ConnectDatabase!
	#mysqlProvider = mysql.createConnection({host: '127.0.0.1', user : 'root', password : ''})


StartNetWorkServices = ->
	console.log 'Starting network services ...'
	AuthServer = new AuthNetServer AUTH_ADRESS, AUTH_PORT
	AuthServer.start!

Main! #Need to start emulator