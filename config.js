var config = {
	// Environment can be "prod" for https, or "dev" for local/http
	"env": "dev",

	// TLS Info - if dev (insecure) environment, keep empty
	"private_key_path": "",
	"ssl_cert_path": "",
	"ca_cert_path": "",

	// Link to Mongo Database
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
