let e = document.querySelectorAll(".option");

e.forEach((e) =>
    e.addEventListener("click", (c) => {
        console.log(c.target.querySelector("a").href);
        window.location.href = c.target.querySelector("a").href;
    })
);
