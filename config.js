var config = {
	// Environment can be "prod" for https, or "dev" for local/http
	"env": "prod",

	// Location of static root folder of the webserver
	// Make sure Node is allowed to write to that folder!
	"static_root": "/var/www/ecerso.party/",

	// Integer to represent the WebSocket connection port number. Must be greater than 1024.
	"ws_port": 8080,

	// TLS Info - if dev (insecure) environment, keep empty
	"private_key_path": "./crt/ecerso.party.key",
	"ssl_cert_path": "./crt/ecerso.party.crt",
	"ca_cert_path": "./crt/sub.class1.server.ca.pem",

	// Link to Mongo Database: mongodb://username:password@server/db
	"mongodb_url": "mongodb://localhost/drops",
	
	// JSON Web Token Info
	"jwt_SECRET": "IEEEruleseverythingaroundme",
	"jwt_AUDIENCE": "https://ecerso.party",
	"jwt_ISSUER": "https://ecerso.party",
	"jwt_EXPIRY": "8h",
	"jwt_ALGORITHM": "HS256",

	"youtube_key": "AIzaSyBhZubf4N-jenWLm8aUQhkxjCc8_EMnEKA"
};

module.exports = config;
