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

changePage("home");

const linki1 = ["https://github.com/TYPOWYSEB4/Graf_Edit/blob/main/%C2%A7eGraf%20Edit%20%C2%A7a1.6%20-%201.19.zip?raw=true", "link2", "link3"];
document.querySelector(".lista1").addEventListener("change", (e) => {
    document.querySelector(".pobierz1").setAttribute("href", linki1[e.target.value]);
});
