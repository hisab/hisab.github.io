(function () {
  const $ = selector => document.querySelector(selector)

  let items = parseJSON(localStorage.getItem('items')) || []
  let lastUpdate = localStorage.getItem('items') || Date.now()

  const $itemAddBtn = $('#itemAddBtn')
  const $itemDialog = $('#itemDialog')
  const $particularInput = $('#particularInput')
  const $rateInput = $('#rateInput')
  const $qtyInput = $('#qtyInput')
  const $removeBtn = $('#removeBtn')
  const $saveBtn = $('#saveBtn')
  const $cancelBtn = $('#cancelBtn')
  const $itemForm = $('#itemForm')
  const $addEdit = $('#addEdit')

  const $mainContainer = $('#mainContainer')
  const $tbody = $('tbody')
  const $grossTotal = $('#grossTotal')
  const $scInput = $('#scInput')
  const $sc = $('#sc')
  const $vatInput = $('#vatInput')
  const $vat = $('#vat')
  const $netTotal = $('#netTotal')

  let editIndex = null
  let lastScrollTop = 0

  init()

  $itemAddBtn.addEventListener('click', showItemDialog)
  $cancelBtn.addEventListener('click', hideItemDialog)
  $itemForm.addEventListener('submit', saveItemHandler)
  $saveBtn.addEventListener('click', saveItemHandler)
  $removeBtn.addEventListener('click', removeItemHandler)
  $mainContainer.addEventListener('scroll', scrollHandler, false)

  ;['change', 'keyup'].forEach(e => {
    $scInput.addEventListener(e, calculate)
    $vatInput.addEventListener(e, calculate)
  })

  function init () {
    if (Date.now() - lastUpdate >= 3 * 3600000 && confirm('Clear previous entries?')) localStorage.clear()

    $scInput.value = localStorage.getItem('sc') || 0
    $vatInput.value = localStorage.getItem('vat') || 0

    if (!$itemDialog.showModal) dialogPolyfill.registerDialog($itemDialog)

    renderItems()
    hideElement($removeBtn)
  }

  function renderItems () {
    $tbody.innerHTML = ''
    items.forEach((item, index) => {
      const $tr = Object.assign(document.createElement('tr'), {
        innerHTML: `<td>${item.particular}</td>
      <td>${item.rate}</td>
      <td>${item.qty}</td>
      <td>${roundNumber(item.rate * item.qty)}</td>`
      })
      $tr.dataset.index = index
      $tr.addEventListener('click', editItemHandler)
      $tbody.appendChild($tr)
    })

    calculate()
    componentHandler.upgradeAllRegistered()
  }

  function calculate () {
    let grossTotal = 0
    let netTotal = 0

    ;[...$tbody.rows].forEach($tr => {
      grossTotal += +[...$tr.cells].pop().innerText
    })

    const sc = percentage($scInput.value, grossTotal)
    const vat = percentage($vatInput.value, grossTotal + sc)

    $grossTotal.innerText = grossTotal
    $sc.innerText = sc
    $vat.innerText = vat
    $netTotal.innerText = roundNumber(grossTotal + sc + vat)

    localStorage.setItem('items', JSON.stringify(items))
    localStorage.setItem('sc', $scInput.value)
    localStorage.setItem('vat', $vatInput.value)
    localStorage.setItem('lastUpdate', Date.now())
  }

  function saveItemHandler () {
    if ($itemForm.checkValidity()) {
      const data = {
        particular: $particularInput.value,
        rate: $rateInput.value,
        qty: $qtyInput.value
      }

      if (editIndex !== null) {
        items[editIndex] = data
      } else {
        items.push(data)
      }

      renderItems()
      hideItemDialog()
    }
  }

  function removeItemHandler () {
    if (editIndex && confirm('Are you sure you want to delete this item?')) {
      items.splice(editIndex, 1)
      editIndex = null

      renderItems()
      hideItemDialog()
    }
  }

  function editItemHandler (e) {
    editIndex = e.target.parentElement.dataset.index
    if (editIndex) {
      const item = items[editIndex]
      $particularInput.value = item.particular
      $rateInput.value = item.rate
      $qtyInput.value = item.qty
    }

    fixMDLInput($particularInput, $rateInput, $qtyInput)

    $addEdit.innerText = 'Edit'
    showElement($removeBtn)
    showItemDialog()
  }

  function showItemDialog (e) {
    if (e && e.target.parentElement === $itemAddBtn) {
      $qtyInput.value = 1
      fixMDLInput($qtyInput)
    }

    $itemDialog.showModal()
  }

  function hideItemDialog () {
    $addEdit.innerText = 'Add'
    hideElement($removeBtn)
    editIndex = null

    $itemForm.reset()
    $itemDialog.close()
  }

  function parseJSON (str) {
    try {
      return JSON.parse(str)
    } catch (e) {
      return null
    }
  }

  function percentage (num, amount) {
    return roundNumber(num * amount / 100)
  }

  function fixMDLInput (...inputs) {
    inputs.forEach($input => {
      $input.parentElement.MaterialTextfield.checkDirty()
      $input.parentElement.MaterialTextfield.checkValidity()
    })
  }

  function scrollHandler () {
    var st = $mainContainer.scrollTop
    var diff = st - lastScrollTop
    if (Math.abs(diff) < 140) return
    (st > lastScrollTop ? hideElement : showElement)($itemAddBtn)
    lastScrollTop = st
  }

  function hideElement ($el) {
    setTimeout(() => $el.classList.add('hidden'), 500)
    $el.classList.add('visually-hidden')
  }

  function showElement ($el) {
    $el.classList.remove('hidden')
    setTimeout(() => $el.classList.remove('visually-hidden'), 10)
  }

  function roundNumber (num) {
    return Math.round(num * 100) / 100
  }
})()
