/* 小改动或者不确定放哪的都可以放这 */

CommandList.prototype.openEdit = function () {
	Window.open('edit-data')
	EditDataInstance.open(this)
}
