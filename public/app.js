let directives = CodeMirror(document.querySelector("#directives"), {
    value: "",
    theme: "ayu-dark",
    mode: "none"
});

let http_req = CodeMirror(document.querySelector("#httprequest"), {
    value: "",
    theme: "ayu-dark",
    mode: "http"
});

let http_res = CodeMirror(document.querySelector("#httpresponse"), {
    value: "",
    theme: "ayu-dark",
    mode: "http"
});

document.getElementById('use_crs').checked = true;

/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2024 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */

(() => {
    'use strict'

    const getStoredTheme = () => localStorage.getItem('theme')
    const setStoredTheme = theme => localStorage.setItem('theme', theme)

    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme()
        if (storedTheme) {
            return storedTheme
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const setTheme = theme => {
        if (theme === 'auto') {
            document.documentElement.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
            const codeMirrorTheme = (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'ayu-dark' : 'default');
            directives.setOption('theme', codeMirrorTheme);
            http_req.setOption('theme', codeMirrorTheme);
            http_res.setOption('theme', codeMirrorTheme);
        } else {
            document.documentElement.setAttribute('data-bs-theme', theme)
            const codeMirrorTheme = theme === 'dark' ? 'ayu-dark' : 'default';
            directives.setOption('theme', codeMirrorTheme);
            http_req.setOption('theme', codeMirrorTheme);
            http_res.setOption('theme', codeMirrorTheme);
        }
    }

    setTheme(getPreferredTheme())

    const showActiveTheme = (theme, focus = false) => {
        const themeSwitcher = document.querySelector('#bd-theme')

        if (!themeSwitcher) {
            return
        }

        const themeSwitcherText = document.querySelector('#bd-theme-text')
        const activeThemeIcon = document.querySelector('.theme-icon-active use')
        const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`)
        const svgOfActiveBtn = btnToActive.querySelector('svg use').getAttribute('href')

        document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
            element.classList.remove('active')
            element.setAttribute('aria-pressed', 'false')
        })

        btnToActive.classList.add('active')
        btnToActive.setAttribute('aria-pressed', 'true')
        activeThemeIcon.setAttribute('href', svgOfActiveBtn)
        const themeSwitcherLabel = `${themeSwitcherText.textContent} (${btnToActive.dataset.bsThemeValue})`
        themeSwitcher.setAttribute('aria-label', themeSwitcherLabel)

        if (focus) {
            themeSwitcher.focus()
        }
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const storedTheme = getStoredTheme()
        if (storedTheme !== 'light' && storedTheme !== 'dark') {
            setTheme(getPreferredTheme())
        }
    })

    window.addEventListener('DOMContentLoaded', () => {
        showActiveTheme(getPreferredTheme())

        document.querySelectorAll('[data-bs-theme-value]')
            .forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const theme = toggle.getAttribute('data-bs-theme-value')
                    setStoredTheme(theme)
                    setTheme(theme)
                    showActiveTheme(theme, true)
                })
            })
    })
})();

function build_table(selector, data) {
    const tbody = selector.getElementsByTagName("tbody")[0];
    tbody.innerHTML = "";
    for (let i = 0; i < data.length; i++) {
        let collection = data[i];
        let tr = document.createElement("tr");
        for (let j = 0; j < collection.length; j++) {
            let col = collection[j];
            const td = document.createElement("td");
            td.appendChild(document.createTextNode(col));
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
}

function run() {
    let req = http_req.getValue();
    const regex = /Content-length:.*\n/g;
    try {
        let sp = req.split("\n\n", 2);
        if (sp.length > 1) {
            req = req.replace(regex, "Content-length: " + sp[1].length + "\n");
            http_req.setValue(req);
        }
    } catch (err) { console.log(err); }
    let crs = document.getElementById('use_crs').checked;
    let result = playground(directives.getValue(), http_req.getValue(), http_res.getValue(), !!crs);
    console.log(result);
    if (result.error) {
        alert(result.error);
        return;
    }
    document.getElementById('transaction_id').textContent = result.transaction_id;
    const collections = JSON.parse(result.collections);
    const matched_data = JSON.parse(result.matched_data);
    const audit_log = result.audit_log;
    build_table(document.getElementById("collections_table"), collections);
    build_table(document.getElementById("matched_data_table"), matched_data);
    document.getElementById('auditlog').textContent = audit_log;
    document.getElementById('disruptive_action').textContent = result.disruptive_action;
    document.getElementById('disruptive_rule').textContent = result.disruptive_rule;
    document.getElementById('duration').textContent = result.duration;
    document.getElementById('rules_matched_total').textContent = result.rules_matched_total;
    window.localStorage.setItem("directives", directives.getValue());
    window.localStorage.setItem("httprequest", http_req.getValue());
    window.localStorage.setItem("httpresponse", http_res.getValue());
}

function filtercols(ele) {
    const val = ele.value.toLowerCase();
    const rows = document.querySelectorAll("#collections tr");
    rows.forEach(function (row) {
        row.style.display = row.textContent.toLowerCase().indexOf(val) > -1 ? "" : "none";
    });
}

const go = new Go();
WebAssembly.instantiateStreaming(fetch("playground.wasm"), go.importObject).then((result) => {
    directives.setValue(window.localStorage.getItem("directives") || "");
    http_req.setValue(window.localStorage.getItem("httprequest") || "");
    http_res.setValue(window.localStorage.getItem("httpresponse") || "");
    go.run(result.instance);
});