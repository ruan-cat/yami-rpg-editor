// 插件工坊
const PluginWorkshop = {
  url: "http://localhost:9050",
  currentPage: 1,
  totalPage: 1,
  identifier: "",
  password: "",
  async login() {
    return await require("electron").ipcRenderer.invoke(
      "net-post",
      `${PluginWorkshop.url}/api/auth/login`,
      {
        data: {
          identifier: PluginWorkshop.identifier,
          password: PluginWorkshop.password
        },
      }
    );
  },
  async register(email, username, password) {
    return await require("electron").ipcRenderer.invoke(
      "net-post",
      `${PluginWorkshop.url}/api/auth/register`,
      {
        data: {
          email: email,
          username: username,
          password: password
        },
      }
    );
  },
  async getCategoryList() {
    return await require("electron").ipcRenderer.invoke(
      "net-get",
      `${PluginWorkshop.url}/api/plugin/categories`,
    );
  },
  async getLatestPluginList() {
    return await require("electron").ipcRenderer.invoke(
      "net-get",
      `${PluginWorkshop.url}/api/plugin/latest-ranking`
    );
  },
  async getDownloadPluginList() {
    return await require("electron").ipcRenderer.invoke(
      "net-get",
      `${PluginWorkshop.url}/api/plugin/downloads-ranking`,
    );
  },
  async downloadPlugin(id) {
    const aLink = document.createElement("a");
    aLink.href = `${PluginWorkshop.url}/api/plugin/download?version_id=${id}`;
    aLink.download = "";
    aLink.click();
    aLink.remove();
  },
  async getPluginAllList() {
    return await require("electron").ipcRenderer.invoke(
      "net-get",
      `${PluginWorkshop.url}/api/plugin/list`,
      {
        params: {
          page: PluginWorkshop.currentPage,
        }
      }
    );
  },
  async previousPage(update) {
    $("#plugin-workshop-all-plugin-list").innerHTML = "";
    PluginWorkshop.currentPage = Math.max(1, PluginWorkshop.currentPage - 1);
    $("#plugin-workshop-current-page").textContent = PluginWorkshop.currentPage;
    await PluginWorkshop.getPluginAllList();
    update?.()
  },
  async nextPage(update) {
    $("#plugin-workshop-all-plugin-list").innerHTML = "";
    PluginWorkshop.currentPage = Math.min(PluginWorkshop.totalPage, PluginWorkshop.currentPage + 1);
    $("#plugin-workshop-current-page").textContent = PluginWorkshop.currentPage;
    await PluginWorkshop.getPluginAllList();
    update?.()
  },
  getItem(name, version, downloadCount, clickEvent) {
    const dom = new DOMParser().parseFromString(`
      <box class="plugin-workshop-list-item">
        <box class="plugin-workshop-list-item-top">
          <text class="plugin-workshop-list-item-name">${name}</text>
          <text class="plugin-workshop-list-item-version">${version}</text>
        </box>
        <box class="plugin-workshop-list-item-bottom">
          <text class="plugin-workshop-list-item-download-count">${downloadCount}</text>
          <button onclick="${clickEvent}">下载</button>
        </box>
      </box>`, "text/html").body.firstChild
    dom.querySelector("button").addEventListener("click", clickEvent);
    return dom;
  },
  getPluginItem(name, version, downloadCount, category, description, clickEvent) {
    const dom = new DOMParser().parseFromString(`
      <box class="plugin-workshop-list-item all">
        <box class="plugin-workshop-list-item-top">
          <text class="plugin-workshop-list-item-name">${name}</text>
          <box class="plugin-workshop-list-item-version-category">
            <text class="plugin-workshop-list-item-version">${version}</text>
            <text class="plugin-workshop-list-item-category">${category}</text>
          </box>
        </box>
        <box class="plugin-workshop-list-item-bottom">
           <text class="plugin-workshop-list-item-description">${description}</text>
           <text class="plugin-workshop-list-item-download-count">${downloadCount}</text>
          <button>下载</button>
        </box>
      </box>`, "text/html").body.firstChild
    dom.querySelector("button").addEventListener("click", clickEvent);
    return dom;
  },
  reset() {
    PluginWorkshop.currentPage = 1;
    $("#plugin-workshop-login-username").textContent = "";
    $("#plugin-workshop-login-role").textContent = "";
    $("#plugin-workshop-login-email").textContent = "";
    $("#plugin-workshop-category").innerHTML = "";
    $("#plugin-workshop-latest-plugin-list").innerHTML = "";
    $("#plugin-workshop-download-plugin-list").innerHTML = "";
    $("#plugin-workshop-all-plugin-list").innerHTML = "";
    $("#plugin-workshop").off("closed", PluginWorkshop.reset);
  },
  removeAllEventListeners(element) {
    const newElement = element.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);
    return newElement;
  },
  log(str) {
    Window.confirm({
      message: str,
    }, [{
      label: '确定',
    }])
  }
};
