'use strict'
(function () {
  const files = ["AudioManager.js","AudioPlayer.js","MultipleAudioPlayer.js","Reverb.js"];
  for (const src of files) {
    document.write('<script src="Script/audio/' + src + '"><\/script>');
  }
})();