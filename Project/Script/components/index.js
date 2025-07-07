'use strict'
(function () {
  const files = ["base.js","WindowFrame.js","TitleBar.js","PageManager.js","MarqueeArea.js","DetailBox.js","DetailSummary.js","TextHistory.js","NumberHistory.js","TextBox.js","TextArea.js","KeyboardBox.js","GamepadBox.js","ColorBox.js","CheckBox.js","RadioProxy.js","RadioBox.js","SwitchItem.js","SliderBox.js","NumberBox.js","SelectBox.js","SelectList.js","MenuList.js","CustomBox.js","NumberVar.js","StringVar.js","TextAreaVar.js","SelectVar.js","FileVar.js","FilterBox.js","TabBar.js","NavBar.js","TreeList.js","DragAndDropHint.js","CommonList.js","ParamHistory.js","ParamList.js","CommandHistory.js","CommandList.js","ParameterPane.js","ScrollBar.js","FileBrowser.js","FileNavPane.js","FileHeadPane.js","FileBodyPane.js"];
  for (const src of files) {
    document.write('<script src="Script/components/' + src + '"><\/script>');
  }
})();