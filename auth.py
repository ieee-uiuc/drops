import ldap
import sys
from bottle import post, request, run

# Connect to UIUC ActiveDirectory over StartTLS
ldap.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, ldap.OPT_X_TLS_NEVER)
ldap.set_option(ldap.OPT_REFERRALS, 0)
l = ldap.initialize("ldap://ad.uillinois.edu")
l.set_option(ldap.OPT_REFERRALS, 0)
l.set_option(ldap.OPT_PROTOCOL_VERSION, 3)
l.set_option(ldap.OPT_X_TLS,ldap.OPT_X_TLS_DEMAND)
l.set_option( ldap.OPT_X_TLS_DEMAND, True )
l.set_option( ldap.OPT_DEBUG_LEVEL, 255 )
l.start_tls_s()

@post('/login')
def login():
	username = 'CN=' + request.forms.get('netid') + ',OU=People,DC=ad,DC=uillinois,DC=edu'
	password = request.forms.get('password')

	try: 
		l.bind_s(username, password)
	except ldap.INVALID_CREDENTIALS:
		return {'status':-1, 'message':'Username or password incorrect.'}
	except ldap.LDAPError, e:
		return {'status':-1, 'message':'Error occurred on login'}
	return {'status':0, 'message':'Login successful'}

run(host='localhost', port=8000, quiet=True)
