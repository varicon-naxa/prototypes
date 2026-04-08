/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Delivery Dockets
   ═══════════════════════════════════════════════════════════════ */

function addDelRow() {
  delData.push({ id: delIdC++, supplier: '', docket: '', material: '', qty: 0, notes: '' });
  renderDel(); updStats(); showToast('Delivery row added');
}

function renderDel() {
  const c = document.getElementById('del-rows');
  if (!delData.length) { c.innerHTML = ''; return; }
  c.innerHTML = delData.map((d, i) => `<div style="display:flex;gap:8px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border);">
    <div style="flex:1;display:grid;grid-template-columns:1fr 1fr 1fr 80px;gap:8px;">
      <div><label style="font-size:10px;color:var(--tm);display:block;margin-bottom:2px;">Supplier</label><input class="vi-sm" style="width:100%;" placeholder="Supplier" value="${d.supplier}" onchange="delData[${i}].supplier=this.value"></div>
      <div><label style="font-size:10px;color:var(--tm);display:block;margin-bottom:2px;">Docket #</label><input class="vi-sm" style="width:100%;" placeholder="Docket number" value="${d.docket}" onchange="delData[${i}].docket=this.value"></div>
      <div><label style="font-size:10px;color:var(--tm);display:block;margin-bottom:2px;">Material</label><input class="vi-sm" style="width:100%;" placeholder="Material" value="${d.material}" onchange="delData[${i}].material=this.value"></div>
      <div><label style="font-size:10px;color:var(--tm);display:block;margin-bottom:2px;">Qty</label><input class="vi-sm" type="number" style="width:100%;" value="${d.qty}" onchange="delData[${i}].qty=this.value"></div>
    </div>
    <button class="rm-btn" style="margin-top:16px;" onclick="delData.splice(${i},1);renderDel();updStats();">✕</button>
  </div>`).join('');
}
