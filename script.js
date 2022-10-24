const container = document.querySelector(".main");
let e = document.querySelector("nav").querySelectorAll(".option");
let currPage = undefined;

e.forEach((e) =>
    e.addEventListener("click", (c) => {
        let page = c.target.getAttribute("page");
        changePage(page);
    })
);

const changePage = (page) => {
    if (currPage == page) return;
    currPage = page;
    container.innerHTML = "";
    let temp = container.querySelectorAll("section").length;
    if (temp) {
        temp.forEach((e) => e.remove());
    }
    let iframe = document.createElement("iframe");
    iframe.setAttribute("src", `pages/${page}.html`);
    iframe.setAttribute("onload", "this.insertAdjacentHTML('afterend', (this.contentDocument.body||this.contentDocument).innerHTML);this.remove()");
    iframe.setAttribute("style", "display: none");
    container.append(iframe);
};

const updateDownload = () => {
    let link = document.querySelector(".link-list").value;
    document.querySelector(".download-button").setAttribute("href", link);
};

changePage("home");
