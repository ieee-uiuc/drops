# Prerequisites

* A Linux (preferably Debian based) distribution with the following applications installed
	* VLC 2.2+
	* NodeJS v4+
	* NPM v2+
	* MongoDB v3+
* Apache or NginX to serve up the front end

# How to Run

1. Run `npm install`
2. Rename `config.js.sample` to `config.js` and fill it out with your deployment parameters
3. Run `npm run deploy`
4. Run `npm start`
5. Go to `localhost` or the IP address/domain name for your computer!

# Our Environment

IEEE runs this on a Raspberry Pi 2 running Raspbian Jessie. Further, the `forever` module is used to run `app.js` as a service. 

# Notes

Since this process creates a child VLC process, and for some reason VLC cannot be run with `sudo`, the WebSocket port number must be >1024. To make this easier to set up, it might be better to set up a WebSocket proxy from Port 80/443 to the chosen port in NginX/Apache.
