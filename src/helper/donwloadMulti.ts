import { TypeImageURLS } from "../types";

export function downloadMulti(event: TypeImageURLS[]) {
  event.forEach((value: TypeImageURLS, idx: number) => {
    setTimeout(() => {
      fetch(value.img, {
        method: "GET",
        headers: {},
      })
        .then((response) => {
          response.arrayBuffer().then(function (buffer) {
            let link = document.createElement("a");

            if (link.download !== undefined) {
              const url = window.URL.createObjectURL(new Blob([buffer]));

              link.setAttribute("href", url);
              link.setAttribute("download", value.name_full);
              link.style.visibility = "hidden";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          });
        })
        .catch((err) => {
          console.log(err);
        });
    }, idx * 200);
  });
}
