# Since this is going to be called from Node, it needs to be in JSON format

import pafy
import json
import sys

url = sys.argv[1]
video = pafy.new(url)

# Attributes
songTitle = video.title
songDuration = video.duration
thumbnailURL = video.bigthumb
audioURL = video.getbestaudio().url

out = {
	'songTitle' : songTitle,
	'songDuration' : songDuration,
	'thumbnailURL' : thumbnailURL,
	'audioURL' : audioURL
}

print(json.dumps(out));
sys.stdout.flush()