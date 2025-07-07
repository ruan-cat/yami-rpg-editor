class MultipleAudioPlayer {
  /**
   * 备用的音频元素池
   * @type {Array<HTMLAudioElement>}
   */ audioPool

  /**
   * 正在播放的音频元素列表
   * @type {Array<HTMLAudioElement>}
   */ audios

  /** 多源音频播放器 */
  constructor() {
    this.audioPool = []
    this.audios = []
  }

  /** 获取音频元素 */
  getAudio() {
    let audio = this.audioPool.pop()
    if (audio === undefined) {
      audio = new Audio()
      const source = AudioManager.context.createMediaElementSource(audio)
      const onStop = () => {
        if (this.audios.remove(audio)) {
          this.audioPool.push(audio)
          source.disconnect(AudioManager.context.destination)
        }
      }
      audio.onStop = onStop
      audio.autoplay = true
      audio.source = source
      audio.on('ended', onStop)
      audio.on('error', onStop)
    }
    this.audios.push(audio)
    audio.source.connect(AudioManager.context.destination)
    return audio
  }

  /**
   * 获取不久前的音频元素
   * @param {string} guid 音频文件ID
   * @returns {audio|undefined}
   */
  getRecentlyAudio(guid) {
    for (const audio of this.audios) {
      if (audio.guid === guid && audio.currentTime < 0.05) {
        return audio
      }
    }
    return undefined
  }

  /**
   * 播放音频文件
   * @param {string} guid 音频文件ID
   * @param {number} [volume = 1] 播放音量[0-1]
   */
  play(guid, volume = 1) {
    if (guid) {
      const audio = this.getRecentlyAudio(guid)
      if (audio) {
        audio.volume = Math.max(audio.volume, volume)
      } else {
        const audio = this.getAudio()
        audio.guid = guid
        audio.src = File.route(File.getPath(guid))
        audio.volume = volume
      }
    }
  }

  /** 停止播放 */
  stop() {
    const {audios} = this
    let i = audios.length
    while (--i >= 0) {
      audios[i].src = ''
      audios[i].onStop()
    }
  }
}

// ******************************** 混响类 ********************************
