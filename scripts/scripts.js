const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show-up');
        }
    });
});

const hiddenElements = document.querySelectorAll('.hidden-up');
hiddenElements.forEach(element => { observer.observe(element); });

function search() {
    let query = document.getElementById('searchField').value;
    let products = document.getElementsByClassName('productTable')[0].getElementsByTagName('tr');
    if (query === '') {
        for (let i = 0; i < products.length; i++) {
            products[i].style.display = 'table-row';
        }
        return;
    }
    for (let i = 0; i < products.length; i++) {
        let product = products[i].id
        if (product.toLowerCase().includes(query.toLowerCase())) {
            products[i].style.display = 'table-row';
        }
        else {
            products[i].style.display = 'none';
        }
    }
}

function showProducts(element) {
    let laboratory = element.value;
    let products = document.getElementsByClassName('productTable')[0].getElementsByTagName('tr');
    if (laboratory === 'all') {
        for (let i = 0; i < products.length; i++) {
            products[i].style.display = 'table-row';
        }
    } else {
        for (let i = 0; i < products.length; i++) {
            if (products[i].classList.value === (laboratory) || products[i].classList.contains('firstRow')) {
                products[i].style.display = 'table-row';
            } else {
                products[i].style.display = 'none';
            }
        }
    }
}

function updateQuantity(productId) {
    let product = document.getElementById(productId);
    let quantity = product.getElementsByClassName('quantity')[0].value;
    if (quantity < 0) {
        product.getElementsByClassName('quantity')[0].value = 0;
        alert('La quantité ne peut pas être négative');
        return;
    }
    let packaging = product.getElementsByClassName('packaging')[0].value;
    let price = product.getElementsByClassName('price')[0].value;
    product.getElementsByClassName('totQty')[0].value = quantity * packaging;
}

function checkPassword() {
    let newPas = document.getElementById('newPassordField')
    let confirmPas = document.getElementById('confirmPasField')
    let msg = document.getElementById('errorMessage')
    let btn = document.getElementById('changePsswdSub')
    if (newPas.value != confirmPas.value) {
        msg.style.display = 'block'
        btn.type = 'button'
    } else {
        msg.style.display = 'none'
        btn.type = 'submit'
    }
}

function showElement(showElementId, hideElementId, cancel) {

    document.getElementById(showElementId).style.display = 'flex';
    document.getElementById(hideElementId).style.display = 'none';
    if (cancel === 1) {
        document.getElementById('cancelBtn').style.display = 'flex';
    } else {
        document.getElementById('cancelBtn').style.display = 'none';
    }
}

function showDiv(divId, element) {
    if (element.value == 'addLaboratory') {
        document.getElementById(divId).style.display = 'block';
    }
    else {
        document.getElementById(divId).style.display = 'none';
    }
}

function checkDate() {
    let startDate = document.getElementById('dateStartField')
    let endDate = document.getElementById('dateEndField')
    if (startDate.value > endDate.value) {
        alert('The start date must be before the end date')
        endDate.value = startDate
    }
}

function showPassword(name, show, hide, value) {
    if (value) {
        document.getElementById(name).type = "text"
        document.getElementById(show).style.display = "none"
        document.getElementById(hide).style.display = "flex"
    } else {
        document.getElementById(name).type = "password"
        document.getElementById(show).style.display = "flex"
        document.getElementById(hide).style.display = "none"
    }
}

function checkPassword() {
    let pas = document.getElementById("password")
    let confirmPas = document.getElementById("confirmPassword")
    let msg = document.getElementById("errorMessage")
    let btn = document.getElementById("submit")
    if (pas.value != confirmPas.value) {
        msg.style.display = "block"
        btn.type = "button"
    } else {
        msg.style.display = "none"
        btn.type = "submit"
    }
}

function showPassword(name, show, hide, value) {
    if (value) {
        document.getElementById(name).type = "text"
        document.getElementById(show).style.display = "none"
        document.getElementById(hide).style.display = "flex"
    } else {
        document.getElementById(name).type = "password"
        document.getElementById(show).style.display = "flex"
        document.getElementById(hide).style.display = "none"
    }
}

function showProducts(element) {
    let laboratory = element.value;
    let products = document.getElementsByClassName('productTable')[0].getElementsByTagName('tr');
    if (laboratory === 'all') {
        for (let i = 0; i < products.length; i++) {
            products[i].style.display = 'table-row';
        }
    } else {
        for (let i = 0; i < products.length; i++) {
            if (products[i].classList.value === (laboratory) || products[i].classList.contains('firstRow')) {
                products[i].style.display = 'table-row';
            } else {
                products[i].style.display = 'none';
            }
        }
    }
}

function updateQuantity(productId, originalQty) {
    let product = document.getElementById(productId);
    let quantity = product.getElementsByClassName('quantity')[0].value;
    if (quantity < 0) {
        product.getElementsByClassName('quantity')[0].value = 0;
        alert('La quantité ne peut pas être négative');
        return;
    }
    let packaging = product.getElementsByClassName('packaging')[0].value;
    let price = product.getElementsByClassName('price')[0].value;
    product.getElementsByClassName('totQty')[0].value = parseInt(originalQty) + parseInt((quantity));

    let basedPrice = product.getElementsByClassName('basedPrice')[0].value = parseInt(product.getElementsByClassName('totQty')[0].value) * price;
}