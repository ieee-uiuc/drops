var config = {
	// Environment can be "prod" for https, or "dev" for local/http
	"env": "dev",

	// Location of static root folder of the webserver
	// Make sure Node is allowed to write to that folder!
	"static_root": "",

	// Integer to represent the WebSocket connection port number. Must be greater than 1024.
	"ws_port": 8080,

	// TLS Info - if dev (insecure) environment, keep empty
	"private_key_path": "",
	"ssl_cert_path": "",
	"ca_cert_path": "",

	// Link to Mongo Database: mongodb://username:password@server/db
	"mongodb_url": "",
	
	// JSON Web Token Info
	"jwt_SECRET": "",
	"jwt_AUDIENCE": "",
	"jwt_ISSUER": "",
	"jwt_EXPIRY": "",
	"jwt_ALGORITHM": "",

	"youtube_key": ""
};

module.exports = config;
