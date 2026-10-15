(() => {
  const search = document.querySelector('#province-search');
  const regionCards = [...document.querySelectorAll('.region-card')];
  const searchStatus = document.querySelector('#region-search-status');
  const noResults = document.querySelector('#no-region-results');

  if (search && regionCards.length && searchStatus && noResults) {
    const allProvinceItems = regionCards.flatMap((region) => [...region.querySelectorAll('.province-list li')]);
    const allProvinceCount = allProvinceItems.length;

    search.addEventListener('input', () => {
      const query = search.value.trim().toLocaleLowerCase('th');
      let visibleCount = 0;
      let visibleRegions = 0;

      regionCards.forEach((region) => {
        const items = [...region.querySelectorAll('.province-list li')];
        let regionalCount = 0;
        items.forEach((item) => {
          const match = !query || item.textContent.toLocaleLowerCase('th').includes(query);
          item.hidden = !match;
          if (match) regionalCount += 1;
        });
        region.hidden = regionalCount === 0;
        visibleCount += regionalCount;
        if (regionalCount) visibleRegions += 1;
      });

      noResults.hidden = visibleCount > 0;
      searchStatus.textContent = query
        ? `แสดง ${visibleCount} จาก ${allProvinceCount} จังหวัด ใน ${visibleRegions} ภูมิภาค`
        : '';
    });
  }

  const form = document.querySelector('#assessment-form');
  const output = document.querySelector('#assessment-output');
  if (form && output) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const fields = [
        ['ประเภทธุรกิจ', data.get('business')],
        ['ภูมิภาค', data.get('region')],
        ['ค่าไฟ/เดือน', data.get('monthlyBill') ? `${data.get('monthlyBill')} บาท` : 'ไม่ระบุ'],
        ['พื้นที่ไซต์', data.get('siteArea') ? `${data.get('siteArea')} m²` : 'ไม่ระบุ'],
        ['ระบบที่สนใจ', data.get('solution')],
      ].filter(([, value]) => Boolean(value));

      const heading = document.createElement('strong');
      heading.textContent = 'BRIEF ตัวอย่าง · ไม่บันทึก / ไม่ส่งข้อมูล';
      const body = document.createElement('p');
      body.className = 'assessment-output-copy';
      body.textContent = fields.map(([label, value]) => `${label}: ${value}`).join(' · ');
      const note = document.createElement('small');
      note.textContent = 'ขั้นต่อไปในงานจริง: ตรวจแหล่งข้อมูลและข้อกำหนดโดยผู้เชี่ยวชาญ — prototype นี้ไม่คำนวณผลตอบแทน';
      output.replaceChildren(heading, body, note);
      output.classList.add('is-ready');
    });

    form.addEventListener('reset', () => {
      output.replaceChildren();
      output.classList.remove('is-ready');
    });
  }
})();
