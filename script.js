const container = document.querySelector(".main");
let e = document.querySelector("nav").querySelectorAll(".option");
let currPage = undefined;

const lang = window.localStorage.getItem("lang") ? window.localStorage.getItem("lang") : "eng";
const language_selection = document.querySelector("select.language-selection");
const language_selection_options = language_selection.querySelectorAll("option");

language_selection.addEventListener("change", (e) => {
    const selected_lang = language_selection.value;
    window.localStorage.setItem("lang", selected_lang);
    window.location.reload();
});

for (let i = 0; i < language_selection_options.length; i++) {
    const val = language_selection_options[i].value;
    if (val == lang) {
        language_selection.selectedIndex = i;
        break;
    }
}

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
    iframe.setAttribute("src", `pages/${lang}/${page}.html`);
    iframe.setAttribute("onload", "this.insertAdjacentHTML('afterend', (this.contentDocument.body||this.contentDocument).innerHTML);this.remove()");
    iframe.setAttribute("style", "display: none");
    container.append(iframe);
};

const updateDownload = (ds, db) => {
    if(!ds && !db){
        document.querySelector(".download-button").setAttribute("href", document.querySelector(".download_selection").selectedOptions[0].getAttribute("link"));
    }else{
        document.getElementById(db).setAttribute("href", document.getElementById(ds).selectedOptions[0].getAttribute("link"));
    }
}
    function checkPswd() {
        var confirmPassword = "dupadupa523";
        var password = document.getElementById("pswd").value;
        if (password == confirmPassword) {
             changePage("secret");
        }
        else{
            alert("Wrong Password");
        }
    }
    changePage("home");