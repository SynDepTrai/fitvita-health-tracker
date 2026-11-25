/* FitVita - Interactive UI Controller & Persistence */
(function () {
  'use strict';

  const Data = window.FitVitaData;
  const Engine = window.FitVitaEngine;

  let state = loadState();
  let setupDraft = {
    gender: state.workoutPlan ? state.workoutPlan.gender : state.profileInput.gender,
    frequency: state.workoutPlan ? state.workoutPlan.frequency : 4,
    dietMode: state.dietMode || 'flexible'
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(Engine.STORAGE_KEY);
      if (!raw) return Engine.createDefaultState();
      return Engine.sanitizeState(JSON.parse(raw));
    } catch (_) {
      return Engine.createDefaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(Engine.STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      showToast('Không thể lưu dữ liệu vào trình duyệt (bộ nhớ đầy hoặc chế độ riêng tư).');
    }
  }

  function formatTimeHHMM(ms) {
    return new Date(ms).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateTime(ms) {
    return new Date(ms).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatRemaining(ms) {
    const totalMin = Math.ceil(Math.max(0, ms) / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
  }

  function showToast(message) {
    const region = document.getElementById('toast-region');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    region.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme === 'dark' ? 'dark' : 'light');
    const iconEl = document.getElementById('theme-icon');
    if (state.theme === 'dark') {
      iconEl.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    } else {
      iconEl.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
  }

  function setTab(tabName) {
    const valid = ['overview', 'workout', 'nutrition', 'history'];
    state.activeTab = valid.includes(tabName) ? tabName : 'overview';
    saveState();

    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.setAttribute('aria-selected', String(btn.dataset.tab === state.activeTab));
    });
    valid.forEach(name => {
      document.getElementById(`panel-${name}`).hidden = name !== state.activeTab;
    });
    renderActiveTab();
  }

  function renderActiveTab() {
    if (state.activeTab === 'overview') renderOverview();
    else if (state.activeTab === 'workout') renderWorkout();
    else if (state.activeTab === 'nutrition') renderNutrition();
    else if (state.activeTab === 'history') renderHistory();
  }

  // ==================== TAB 1: TỔNG QUAN & CHỈ SỐ ====================
  function renderOverview() {
    const container = document.getElementById('panel-overview');
    const p = state.profileInput;
    const a = state.assessment;
    const plan = state.workoutPlan;

    const step1Done = Boolean(a);
    const step2Done = Boolean(plan);

    const stepperHtml = `
      <div class="stepper-bar" aria-label="Tiến trình thiết lập nhanh">
        <button type="button" class="step-chip ${!step1Done ? 'is-current' : 'is-done'}" data-step-jump="form">
          <span class="step-num">${step1Done ? '✓' : '1'}</span>
          <span class="step-copy">
            <strong>Bước 1: Nhập chỉ số</strong>
            <span>${step1Done ? `BMI ${a.bmi} • ${a.categoryLabel}` : 'Tính BMI & calo mỗi ngày'}</span>
          </span>
        </button>
        <button type="button" class="step-chip ${step1Done && !step2Done ? 'is-current' : (step2Done ? 'is-done' : '')}" data-step-jump="setup">
          <span class="step-num">${step2Done ? '✓' : '2'}</span>
          <span class="step-copy">
            <strong>Bước 2: Chọn lộ trình</strong>
            <span>${step2Done ? `${plan.frequency} buổi/tuần • ${state.dietMode === 'strict' ? 'Khắt khe' : 'Cơm nhà'}` : 'Chọn số buổi & kiểu ăn'}</span>
          </span>
        </button>
        <button type="button" class="step-chip ${step2Done ? 'is-current' : ''}" data-step-jump="workout">
          <span class="step-num">3</span>
          <span class="step-copy">
            <strong>Bước 3: Bắt đầu tập &amp; ăn</strong>
            <span>${step2Done ? `Buổi tới: ${plan.days[plan.activeDayIndex].dayLabel}` : 'Hoặc tự chọn bài tập hôm nay'}</span>
          </span>
        </button>
      </div>
    `;

    // Thanh hành động nhanh ngay trên cùng khi người dùng đã có lộ trình
    let todayStripHtml = '';
    if (plan) {
      const activeDay = plan.days[plan.activeDayIndex];
      const doneInActive = activeDay.exercises.filter(e => e.completed).length;
      const totalInActive = activeDay.exercises.length;
      todayStripHtml = `
        <div class="today-strip">
          <div class="today-strip-info">
            <span class="badge badge-light">Tuần ${plan.weekNumber} • ${escapeHtml(activeDay.dayLabel)}</span>
            <h2>Buổi tập tiếp theo: ${escapeHtml(activeDay.title)}</h2>
            <p>${activeDay.startedAt ? `Đang tập (${doneInActive}/${totalInActive} bài đã xong) — nhớ hoàn thành trong khung 5 tiếng.` : `Gồm ${totalInActive} bài tập • Chế độ ăn: ${state.dietMode === 'strict' ? 'Khắt khe (Macro)' : 'Linh hoạt (Cơm nhà)'}.`}</p>
          </div>
          <div class="today-strip-actions">
            <button type="button" class="btn btn-primary" id="quick-go-workout">
              ${activeDay.startedAt ? 'Tiếp tục buổi tập' : 'Mở buổi tập ngay'}
            </button>
            <button type="button" class="btn btn-light" id="quick-go-nutrition">Xem thực đơn</button>
          </div>
        </div>
      `;
    }

    const activityOptions = Data.ACTIVITY_LEVELS.map(lv =>
      `<option value="${escapeHtml(lv.id)}" ${p.activityId === lv.id ? 'selected' : ''}>${escapeHtml(lv.label)}</option>`
    ).join('');

    let resultHtml = '';
    if (!a) {
      resultHtml = `
        <div class="card empty-card">
          <span class="badge badge-accent" style="margin-bottom:10px;">Hướng dẫn nhanh</span>
          <h3>Điền 5 thông tin bên trái rồi bấm "Xem kết quả"</h3>
          <p>Bạn sẽ biết ngay chỉ số BMI, mức calo cơ thể tiêu thụ mỗi ngày và lời khuyên nên tăng cân, giảm mỡ hay giữ dáng.</p>
        </div>
      `;
    } else {
      const toneBadge = `badge-${a.statusTone}`;
      const th = a.thresholds || Engine.getBmiThresholds(a.gender);
      resultHtml = `
        <div class="card" id="assessment-result">
          <div class="card-header">
            <div>
              <h2 class="card-title">Kết quả chỉ số cơ thể</h2>
              <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">Áp dụng thang đo riêng: ${escapeHtml(th.standardLabel)}</div>
            </div>
            <span class="badge ${toneBadge}">${escapeHtml(a.categoryLabel)}</span>
          </div>

          <div class="bmi-hero">
            <div class="bmi-value-block">
              <span class="bmi-number tabular">${a.bmi.toFixed(1)}</span>
              <div>
                <div style="font-weight:700; font-size:0.94rem;">BMI • Mỡ ước tính ~${a.bodyFatPct.toFixed(1)}%</div>
                <div style="font-size:0.82rem; color:var(--text-muted);">Cân nặng chuẩn (${a.gender === 'male' ? 'Nam' : 'Nữ'}): ${a.idealMin} – ${a.idealMax} kg</div>
              </div>
            </div>
            <span class="badge badge-neutral">${escapeHtml(a.bodyFatLabel)}</span>
          </div>

          <div class="bmi-scale-wrap" aria-label="Thước đo BMI trực quan theo giới tính">
            <div class="bmi-bar-track">
              <div class="bmi-seg" title="Thiếu cân (&lt; ${th.under})"></div>
              <div class="bmi-seg" title="Cân đối (${th.under} – ${th.normalMax})"></div>
              <div class="bmi-seg" title="Thừa cân (${th.over.toFixed(1)} – ${th.overMax})"></div>
              <div class="bmi-seg" title="Béo phì (&ge; ${th.obese.toFixed(1)})"></div>
              <div class="bmi-needle" style="left: ${a.bmiGaugePercent}%;" title="BMI của bạn: ${a.bmi}"></div>
            </div>
            <div class="bmi-ticks">
              <span>Thiếu cân<br/>&lt; ${th.under}</span>
              <span>Cân đối<br/>${th.under} – ${th.normalMax}</span>
              <span>Thừa cân<br/>${th.over.toFixed(1)} – ${th.overMax}</span>
              <span>Béo phì<br/>&ge; ${th.obese.toFixed(1)}</span>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-box">
              <div class="kpi-label">Calo tiêu thụ/ngày (TDEE)</div>
              <div class="kpi-value tabular">${a.tdee.toLocaleString('vi-VN')} <small style="font-size:0.76rem;font-weight:600;">kcal</small></div>
              <div class="kpi-sub">Năng lượng nền (BMR): ${a.bmr.toLocaleString('vi-VN')}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Nên nạp mỗi ngày</div>
              <div class="kpi-value tabular" style="color:var(--accent);">${a.targetCalories.toLocaleString('vi-VN')} <small style="font-size:0.76rem;font-weight:600;">kcal</small></div>
              <div class="kpi-sub">${a.goal === 'gain' ? `Tăng thêm +${a.gender === 'male' ? 350 : 250} kcal/ngày` : a.goal === 'lose' ? 'Giảm nhẹ để đốt mỡ' : 'Giữ nguyên để giữ dáng'}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Gợi ý dưỡng chất/ngày</div>
              <div class="kpi-value tabular" style="font-size:0.95rem; line-height:1.4; padding-top:2px;">
                Đạm ${a.macros.protein}g • Bột ${a.macros.carbs}g<br/>Chất béo ${a.macros.fat}g
              </div>
            </div>
          </div>

          <div class="commentary-box">
            <p><strong>Đánh giá thể trạng:</strong> ${escapeHtml(a.summary)}</p>
            <p>${escapeHtml(a.advice)}</p>
          </div>

          <div class="cta-question-card">
            <div>
              <h3>Bạn có muốn hệ thống lên lịch tập luyện và thực đơn ăn uống phù hợp không?</h3>
              <p>Chỉ mất 10 giây chọn số buổi rảnh mỗi tuần và kiểu ăn quen thuộc.</p>
            </div>
            <button type="button" class="btn btn-primary" id="open-setup-btn">
              ${plan ? 'Đổi lịch tập / kiểu ăn' : 'Bắt đầu thiết lập lộ trình'}
            </button>
          </div>
        </div>
      `;
    }

    let setupHtml = '';
    if (a && state.setupOpen) {
      const genderFocusText = setupDraft.gender === 'male'
        ? 'Giáo án Nam: ưu tiên phát triển cơ bắp toàn thân, thân trên (ngực, vai, lưng, tay) và sức mạnh.'
        : 'Giáo án Nữ: ưu tiên săn chắc, đốt mỡ, tập trung vào mông, đùi, eo và độ dẻo dai.';

      const freqCards = [3, 4, 5, 6].map(freq => {
        const tpl = Data.WORKOUT_TEMPLATES[setupDraft.gender][freq];
        const restCount = 7 - freq;
        const badge = freq === 4 ? '<span class="badge badge-accent">Phổ biến</span>' : '';
        return `
          <button type="button" class="choice-card" data-setup-freq="${freq}" aria-pressed="${setupDraft.frequency === freq}">
            <div class="choice-card-top">
              <strong>${freq} buổi / tuần</strong>
              ${badge}
            </div>
            <span>${escapeHtml(tpl.splitName)}</span>
            <span style="color:var(--accent); font-weight:700;">Có ${restCount} ngày nghỉ phục hồi</span>
          </button>
        `;
      }).join('');

      setupHtml = `
        <div class="card setup-card" id="setup-wizard">
          <div class="card-header">
            <div>
              <span class="badge badge-accent">Thiết lập nhanh 3 lựa chọn</span>
              <h2 class="card-title" style="margin-top:6px;">Tạo lịch tập &amp; thực đơn riêng cho bạn</h2>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" id="close-setup-btn">Thu gọn</button>
          </div>

          <div class="stack">
            <div>
              <div class="setup-step-label">1. Định hướng bài tập theo giới tính</div>
              <div class="segment-group" style="max-width:520px;">
                <button type="button" class="segment-btn" data-setup-gender="male" aria-pressed="${setupDraft.gender === 'male'}">Nam — Tăng cơ &amp; Sức mạnh</button>
                <button type="button" class="segment-btn" data-setup-gender="female" aria-pressed="${setupDraft.gender === 'female'}">Nữ — Săn chắc &amp; Đốt mỡ</button>
              </div>
              <p style="margin:8px 0 0; font-size:0.86rem; color:var(--text-secondary);">${escapeHtml(genderFocusText)}</p>
            </div>

            <div>
              <div class="setup-step-label">2. Bạn rảnh mấy buổi mỗi tuần để tập?</div>
              <div class="freq-grid">${freqCards}</div>
            </div>

            <div>
              <div class="setup-step-label">3. Chọn kiểu thực đơn bạn dễ theo nhất</div>
              <div class="diet-choice-grid">
                <button type="button" class="choice-card" data-setup-diet="flexible" aria-pressed="${setupDraft.dietMode === 'flexible'}">
                  <div class="choice-card-top">
                    <strong>Không khắt khe (Cơm nhà)</strong>
                    <span class="badge badge-accent">Dễ theo nhất</span>
                  </div>
                  <span>Món ăn quen thuộc bữa cơm Việt Nam, dễ mua dễ nấu, ước lượng khẩu phần đơn giản mà vẫn đủ chất.</span>
                </button>
                <button type="button" class="choice-card" data-setup-diet="strict" aria-pressed="${setupDraft.dietMode === 'strict'}">
                  <div class="choice-card-top">
                    <strong>Khắt khe (Chuẩn Calo &amp; Macro)</strong>
                    <span class="badge badge-info">Sát mục tiêu</span>
                  </div>
                  <span>Tính sát Đạm/Tinh bột/Chất béo; ưu tiên món luộc, hấp, áp chảo ít dầu mỡ, hạn chế đường và gia vị.</span>
                </button>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end;">
              <button type="button" class="btn btn-primary" id="confirm-setup-btn">Tạo lịch tập &amp; thực đơn ngay</button>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h1 class="page-title">Tổng quan &amp; Chỉ số cơ thể</h1>
          <p class="page-subtitle">Theo dõi thể trạng và nhận lịch tập + thực đơn cá nhân hóa chỉ trong 2 bước.</p>
        </div>
      </div>

      <div class="stack">
        ${stepperHtml}
        ${todayStripHtml}

        <div class="grid-2">
          <form class="card" id="assessment-form" novalidate>
            <div class="card-header">
              <h2 class="card-title">Nhập thông tin của bạn</h2>
              <span class="badge badge-neutral">Tự động lưu</span>
            </div>

            <div class="form-grid">
              <div class="field full">
                <label>Giới tính</label>
                <div class="segment-group">
                  <button type="button" class="segment-btn" data-form-gender="male" aria-pressed="${p.gender === 'male'}">Nam</button>
                  <button type="button" class="segment-btn" data-form-gender="female" aria-pressed="${p.gender === 'female'}">Nữ</button>
                </div>
              </div>

              <div class="field">
                <label for="inp-age">Tuổi</label>
                <div class="input-unit-wrap">
                  <input id="inp-age" class="input tabular" type="number" min="12" max="100" required value="${escapeHtml(p.age)}" />
                  <span class="input-unit">tuổi</span>
                </div>
              </div>

              <div class="field">
                <label for="inp-height">Chiều cao</label>
                <div class="input-unit-wrap">
                  <input id="inp-height" class="input tabular" type="number" min="100" max="250" step="0.5" required value="${escapeHtml(p.heightCm)}" />
                  <span class="input-unit">cm</span>
                </div>
              </div>

              <div class="field full">
                <label for="inp-weight">Cân nặng hiện tại</label>
                <div class="input-unit-wrap">
                  <input id="inp-weight" class="input tabular" type="number" min="25" max="250" step="0.1" required value="${escapeHtml(p.weightKg)}" />
                  <span class="input-unit">kg</span>
                </div>
              </div>

              <div class="field full">
                <label for="inp-activity">Mức độ vận động hiện tại</label>
                <select id="inp-activity" class="select">${activityOptions}</select>
              </div>
            </div>

            <div id="assessment-error" class="field-error" role="alert"></div>

            <div style="margin-top:16px;">
              <button type="submit" class="btn btn-navy" style="width:100%;">
                ${a ? 'Cập nhật lại chỉ số BMI &amp; TDEE' : 'Xem kết quả BMI &amp; TDEE'}
              </button>
            </div>
          </form>

          ${resultHtml}
        </div>

        ${setupHtml}
      </div>
    `;

    bindOverviewEvents();
  }

  function bindOverviewEvents() {
    document.querySelectorAll('[data-step-jump]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.stepJump;
        if (target === 'form') {
          const el = document.getElementById('assessment-form');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (target === 'setup') {
          if (!state.assessment) {
            showToast('Hãy bấm "Xem kết quả BMI & TDEE" ở Bước 1 trước nhé!');
            return;
          }
          state.setupOpen = true;
          saveState();
          renderOverview();
          const wiz = document.getElementById('setup-wizard');
          if (wiz) wiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (target === 'workout') {
          setTab('workout');
        }
      });
    });

    const form = document.getElementById('assessment-form');
    if (form) {
      form.querySelectorAll('[data-form-gender]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.profileInput.gender = btn.dataset.formGender;
          form.querySelectorAll('[data-form-gender]').forEach(b =>
            b.setAttribute('aria-pressed', String(b.dataset.formGender === state.profileInput.gender))
          );
        });
      });

      form.addEventListener('submit', e => {
        e.preventDefault();
        const errBox = document.getElementById('assessment-error');
        errBox.textContent = '';

        const input = {
          gender: state.profileInput.gender,
          age: Number(document.getElementById('inp-age').value),
          heightCm: Number(document.getElementById('inp-height').value),
          weightKg: Number(document.getElementById('inp-weight').value),
          activityId: document.getElementById('inp-activity').value
        };

        try {
          const result = Engine.assessBody(input);
          state.profileInput = input;
          state.assessment = result;
          setupDraft.gender = result.gender;
          if (state.weeklyMenu) {
            state.weeklyMenu = Engine.generateWeeklyMenu(state.dietMode, result.targetCalories, state.menuSeed);
          }
          saveState();
          renderOverview();
          const resCard = document.getElementById('assessment-result');
          if (resCard && window.innerWidth <= 960) resCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          showToast(`BMI ${result.bmi} (${result.categoryLabel}) • Tiêu thụ ${result.tdee} kcal/ngày`);
        } catch (err) {
          errBox.textContent = err.message;
        }
      });
    }

    const openSetupBtn = document.getElementById('open-setup-btn');
    if (openSetupBtn) {
      openSetupBtn.addEventListener('click', () => {
        setupDraft.gender = state.workoutPlan ? state.workoutPlan.gender : state.assessment.gender;
        setupDraft.frequency = state.workoutPlan ? state.workoutPlan.frequency : 4;
        setupDraft.dietMode = state.dietMode || 'flexible';
        state.setupOpen = true;
        saveState();
        renderOverview();
        const wizard = document.getElementById('setup-wizard');
        if (wizard) wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    const closeSetupBtn = document.getElementById('close-setup-btn');
    if (closeSetupBtn) {
      closeSetupBtn.addEventListener('click', () => {
        state.setupOpen = false;
        saveState();
        renderOverview();
      });
    }

    document.querySelectorAll('[data-setup-gender]').forEach(btn => {
      btn.addEventListener('click', () => {
        setupDraft.gender = btn.dataset.setupGender;
        renderOverview();
      });
    });

    document.querySelectorAll('[data-setup-freq]').forEach(btn => {
      btn.addEventListener('click', () => {
        setupDraft.frequency = Number(btn.dataset.setupFreq);
        renderOverview();
      });
    });

    document.querySelectorAll('[data-setup-diet]').forEach(btn => {
      btn.addEventListener('click', () => {
        setupDraft.dietMode = btn.dataset.setupDiet;
        renderOverview();
      });
    });

    const confirmSetupBtn = document.getElementById('confirm-setup-btn');
    if (confirmSetupBtn) {
      confirmSetupBtn.addEventListener('click', () => {
        const targetKcal = state.assessment ? state.assessment.targetCalories : 1900;
        state.workoutPlan = Engine.buildWeeklySchedule(setupDraft.gender, setupDraft.frequency, 1);
        state.selectedWorkoutDay = state.workoutPlan.activeDayIndex;
        state.dietMode = setupDraft.dietMode;
        state.weeklyMenu = Engine.generateWeeklyMenu(state.dietMode, targetKcal, state.menuSeed);
        state.selectedMenuDay = 0;
        state.setupOpen = false;
        state.pendingMissedAlert = null;
        saveState();
        showToast(`Đã tạo xong lịch tập ${setupDraft.frequency} buổi/tuần và thực đơn 7 ngày!`);
        setTab('workout');
      });
    }

    const quickWorkout = document.getElementById('quick-go-workout');
    if (quickWorkout) {
      quickWorkout.addEventListener('click', () => {
        state.selectedWorkoutDay = state.workoutPlan.activeDayIndex;
        setTab('workout');
      });
    }

    const quickNutrition = document.getElementById('quick-go-nutrition');
    if (quickNutrition) {
      quickNutrition.addEventListener('click', () => setTab('nutrition'));
    }
  }

  // ==================== TAB 2: LỊCH TẬP ====================
  function renderWorkout() {
    const container = document.getElementById('panel-workout');
    const plan = state.workoutPlan;

    if (!plan) {
      const todayLabel = Data.DAY_NAMES[Engine.getTodayDayIndex()];
      const presetCardsHtml = Data.CUSTOM_WORKOUT_PRESETS.map(pr => `
        <button type="button" class="choice-card" data-pick-preset="${escapeHtml(pr.id)}">
          <div class="choice-card-top">
            <strong>${escapeHtml(pr.shortLabel)}</strong>
            <span class="badge badge-accent">${pr.exercises.length} bài</span>
          </div>
          <span>${escapeHtml(pr.focus)}</span>
        </button>
      `).join('');

      container.innerHTML = `
        <div class="page-head">
          <div>
            <h1 class="page-title">Lịch tập luyện hôm nay (${escapeHtml(todayLabel)})</h1>
            <p class="page-subtitle">Đã biết hôm nay muốn tập nhóm cơ nào? Chọn ngay bên dưới để hệ thống rải sẵn bài tập chuẩn cho bạn.</p>
          </div>
        </div>

        <div class="stack">
          <div class="card">
            <div class="card-header" style="margin-bottom:6px;">
              <h2 class="card-title">Hôm nay bạn muốn tập gì?</h2>
              <span class="badge badge-accent">Rải sẵn bài tập ngay</span>
            </div>
            <p style="margin:0; font-size:0.88rem; color:var(--text-secondary);">Chọn 1 nhóm cơ muốn tập — bảng bài tập, số hiệp × lần, hướng dẫn kỹ thuật và đồng hồ chốt 5 tiếng sẽ sẵn sàng ngay lập tức.</p>
            <div class="preset-grid">${presetCardsHtml}</div>
          </div>

          <div class="card" style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:14px;">
            <div>
              <strong style="font-size:0.96rem;">Chưa biết nên chia lịch tập thế nào?</strong>
              <div style="font-size:0.85rem; color:var(--text-secondary);">Đánh giá BMI &amp; TDEE để hệ thống tự lên lịch tập cả tuần (3–6 buổi) kèm ngày nghỉ phục hồi.</div>
            </div>
            <button type="button" class="btn btn-outline btn-sm" id="goto-overview-from-workout">Đánh giá &amp; lên lịch cả tuần</button>
          </div>
        </div>
      `;

      document.querySelectorAll('[data-pick-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
          const res = Engine.applyCustomFocusToDay(state, Engine.getTodayDayIndex(), btn.dataset.pickPreset);
          if (res.ok) {
            saveState();
            renderWorkout();
            showToast(`Đã rải sẵn ${res.preset.exercises.length} bài cho buổi ${res.preset.shortLabel}!`);
          }
        });
      });
      document.getElementById('goto-overview-from-workout').addEventListener('click', () => setTab('overview'));
      return;
    }

    const selectedIdx = Number.isInteger(state.selectedWorkoutDay) && plan.days[state.selectedWorkoutDay]
      ? state.selectedWorkoutDay
      : plan.activeDayIndex;
    const day = plan.days[selectedIdx];
    const now = Date.now();

    const statusTextMap = {
      pending: 'Chưa tập',
      in_progress: 'Đang tập',
      completed: '✓ Đã xong',
      auto_closed: 'Chốt 5h',
      rest: 'Nghỉ ngơi'
    };

    const weekStripHtml = plan.days.map((d, idx) => {
      const isSelected = idx === selectedIdx;
      const isActive = idx === plan.activeDayIndex && !d.isRest;
      const statusLabel = isActive && d.status === 'pending' ? 'Buổi hiện tại' : statusTextMap[d.status];
      const customPreset = d.isCustom ? Data.CUSTOM_WORKOUT_PRESETS.find(p => p.id === d.customPresetId) : null;
      const shortName = d.isRest
        ? 'Nghỉ phục hồi'
        : (customPreset ? customPreset.shortLabel : d.title.split('—')[0].trim());
      return `
        <button type="button"
          class="day-pill ${d.isRest ? 'is-rest' : ''} ${isSelected ? 'is-selected' : ''} ${isActive ? 'is-active-session' : ''}"
          data-select-day="${idx}"
          aria-pressed="${isSelected}">
          <span class="day-pill-name">${escapeHtml(d.dayLabel)}</span>
          <span class="day-pill-short">${escapeHtml(shortName)}</span>
          <span class="day-pill-status status-${d.status}">${escapeHtml(statusLabel)}</span>
        </button>
      `;
    }).join('');

    let quickFocusHtml = '';
    if (!day.locked) {
      const chipsHtml = Data.CUSTOM_WORKOUT_PRESETS.map(pr => {
        const isPicked = day.isCustom && day.customPresetId === pr.id;
        return `
          <button type="button" class="focus-chip" data-pick-preset="${escapeHtml(pr.id)}" aria-pressed="${isPicked}">
            ${escapeHtml(pr.shortLabel)}
          </button>
        `;
      }).join('');
      const restoreBtn = day.isCustom
        ? `<button type="button" class="btn btn-ghost btn-sm" id="restore-day-btn">Về lịch gốc</button>`
        : '';

      quickFocusHtml = `
        <div class="quick-focus-card" aria-label="Tự chọn nhóm cơ tập cho ${escapeHtml(day.dayLabel)}">
          <div class="quick-focus-head">
            <span class="quick-focus-title">Đã biết ${escapeHtml(day.dayLabel)} muốn tập gì? Chọn nhanh để rải sẵn bài tập:</span>
            ${restoreBtn}
          </div>
          <div class="focus-chips">${chipsHtml}</div>
        </div>
      `;
    }

    let detailHtml = '';
    if (day.isRest) {
      const tipsHtml = Data.REST_DAY_TIPS.map(t => `
        <div class="tip-card">
          <h4>${escapeHtml(t.title)}</h4>
          <p>${escapeHtml(t.desc)}</p>
        </div>
      `).join('');

      const activeDay = plan.days[plan.activeDayIndex];
      detailHtml = `
        <div class="card">
          <div class="rest-hero">
            <span class="badge badge-info" style="margin-bottom:8px;">${escapeHtml(day.dayLabel)} • Ngày nghỉ phục hồi (Rest Day)</span>
            <h3>${escapeHtml(day.title)}</h3>
            <p>${escapeHtml(day.focus)} — Nghỉ đúng cách giúp cơ bắp hồi phục nhanh, tăng sức bền và tránh quá tải chấn thương.</p>
          </div>

          <div class="grid-auto" style="margin-bottom:18px;">${tipsHtml}</div>

          <div style="display:flex; justify-content:flex-end;">
            <button type="button" class="btn btn-primary btn-sm" id="jump-active-workout-btn">
              Mở buổi tập tiếp theo (${escapeHtml(activeDay.dayLabel)})
            </button>
          </div>
        </div>
      `;
    } else {
      const total = day.exercises.length;
      const done = day.exercises.filter(e => e.completed).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const isAllDone = done === total && total > 0;

      let bannerClass = 'session-banner';
      let bannerLeft = '';
      let bannerRight = '';

      if (day.locked) {
        const missedCount = total - done;
        bannerLeft = `
          <div>
            <span class="badge ${day.status === 'auto_closed' ? 'badge-warning' : 'badge-success'}">
              ${day.status === 'auto_closed' ? 'Đã tự động chốt sau 5 tiếng' : 'Buổi tập đã hoàn thành'}
            </span>
            <div style="font-size:0.89rem; color:var(--text-secondary); margin-top:6px;">
              Kết quả đã khóa: hoàn thành <strong>${done}/${total}</strong> bài${missedCount > 0 ? `, bỏ lỡ <strong>${missedCount}</strong> bài` : ''} (chốt lúc ${formatTimeHHMM(day.endedAt || now)}).
            </div>
          </div>
        `;
        const nextDay = plan.days[plan.activeDayIndex];
        bannerRight = `
          <button type="button" class="btn btn-primary btn-sm" id="jump-active-workout-btn">
            Chuyển tới ${escapeHtml(nextDay.dayLabel)}
          </button>
        `;
      } else if (day.startedAt != null && isAllDone) {
        bannerClass = 'session-banner is-celebrate';
        bannerLeft = `
          <div>
            <strong style="font-size:0.98rem; color:var(--accent);">Tuyệt vời! Bạn đã hoàn thành đủ ${done}/${total} bài tập</strong>
            <div style="font-size:0.85rem; color:var(--text-secondary);">Bấm nút bên cạnh để lưu kết quả vào lịch sử và mở sẵn buổi tập tiếp theo.</div>
          </div>
        `;
        bannerRight = `
          <button type="button" class="btn btn-primary" id="finish-session-btn">Lưu hoàn thành &amp; sang buổi tiếp theo</button>
        `;
      } else if (day.startedAt != null) {
        const remainingMs = Engine.FIVE_HOURS_MS - (now - day.startedAt);
        bannerLeft = `
          <div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px;">
            <span class="timer-chip tabular" id="live-session-timer">
              Bắt đầu ${formatTimeHHMM(day.startedAt)} • Tự động chốt sau ${formatRemaining(remainingMs)}
            </span>
            <span style="font-size:0.85rem; color:var(--text-secondary);">Bấm vào ô hoặc tên bài tập để đánh dấu hoàn thành.</span>
          </div>
        `;
        bannerRight = `
          <button type="button" class="btn btn-outline btn-sm" id="finish-session-btn">Kết thúc sớm &amp; chốt buổi tập</button>
        `;
      } else {
        bannerLeft = `
          <div>
            <strong style="font-size:0.96rem;">Sẵn sàng tập ${escapeHtml(day.dayLabel)}</strong>
            <div style="font-size:0.85rem; color:var(--text-secondary);">Bấm "Bắt đầu tập" hoặc tick trực tiếp bài đầu tiên (hệ thống sẽ đếm khung 5 tiếng).</div>
          </div>
        `;
        bannerRight = `
          <button type="button" class="btn btn-primary" id="start-session-btn">Bắt đầu tập</button>
        `;
      }

      const rowsHtml = day.exercises.map((ex, i) => {
        const isMissed = day.locked && !ex.completed;
        const rowClass = ex.completed ? 'is-done' : (isMissed ? 'is-missed' : '');
        const checkId = `ex-chk-${selectedIdx}-${i}`;
        return `
          <tr class="${rowClass}">
            <td class="ex-check-cell">
              <label class="check-hit" for="${checkId}">
                <input id="${checkId}" type="checkbox"
                  class="ex-checkbox"
                  data-ex-check="${escapeHtml(ex.id)}"
                  aria-label="Hoàn thành ${escapeHtml(ex.name)}"
                  ${ex.completed ? 'checked' : ''}
                  ${day.locked ? 'disabled' : ''} />
                <span class="mobile-check-hint">${ex.completed ? 'Đã xong' : (isMissed ? 'Đã bỏ lỡ' : 'Đánh dấu xong')}</span>
              </label>
            </td>
            <td>
              <label class="ex-name-label" for="${checkId}">
                <span class="ex-name">${escapeHtml(ex.name)}</span>
                <span class="ex-muscle">${escapeHtml(ex.muscle)}${isMissed ? ' • Đã bỏ lỡ' : ''}</span>
              </label>
            </td>
            <td>
              <span class="ex-spec tabular">${ex.sets} hiệp × ${escapeHtml(ex.reps)}</span>
              <span class="ex-rest">Nghỉ giữa hiệp: ${escapeHtml(ex.rest)}</span>
            </td>
            <td class="ex-action-cell">
              <button type="button" class="btn btn-outline btn-sm" data-ex-guide="${escapeHtml(ex.id)}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <span>Xem hướng dẫn</span>
              </button>
            </td>
          </tr>
        `;
      }).join('');

      detailHtml = `
        <div class="card">
          <div class="card-header">
            <div>
              <span class="badge badge-accent">Tuần ${plan.weekNumber} • ${escapeHtml(day.dayLabel)}</span>
              <h2 class="card-title" style="margin-top:6px;">${escapeHtml(day.title)}</h2>
              <div style="font-size:0.86rem; color:var(--text-secondary); margin-top:2px;">Trọng tâm: ${escapeHtml(day.focus)}</div>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" id="change-plan-btn">Đổi lịch tập</button>
          </div>

          <div class="${bannerClass}">
            ${bannerLeft}
            <div>${bannerRight}</div>
          </div>

          <div class="progress-wrap">
            <div class="progress-meta">
              <span>Tiến độ buổi tập</span>
              <span class="tabular" style="color:var(--accent);">${done}/${total} bài tập (${pct}%)</span>
            </div>
            <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Tiến độ hoàn thành buổi tập">
              <div class="progress-fill" style="width:${pct}%;"></div>
            </div>
          </div>

          <table class="workout-table">
            <thead>
              <tr>
                <th>Xong</th>
                <th>Tên bài tập</th>
                <th>Hiệp × Lần &amp; Nghỉ</th>
                <th>Hướng dẫn</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h1 class="page-title">Lịch tập luyện • Tuần ${plan.weekNumber}</h1>
          <p class="page-subtitle">${escapeHtml(plan.splitName)}</p>
        </div>
      </div>

      <div class="week-strip-head">
        <span>Chọn ngày trong tuần để xem chi tiết:</span>
        <span class="legend-inline">
          <span class="legend-dot"><i style="background:var(--accent);"></i>Buổi hiện tại</span>
          <span class="legend-dot"><i style="background:var(--ocean);"></i>Ngày nghỉ phục hồi</span>
        </span>
      </div>

      <div class="week-strip" role="group" aria-label="Chọn ngày trong tuần">
        ${weekStripHtml}
      </div>

      ${quickFocusHtml}
      ${detailHtml}
    `;

    bindWorkoutEvents(selectedIdx);
  }

  function bindWorkoutEvents(selectedIdx) {
    document.querySelectorAll('[data-select-day]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedWorkoutDay = Number(btn.dataset.selectDay);
        saveState();
        renderWorkout();
      });
    });

    document.querySelectorAll('[data-pick-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const currentDay = state.workoutPlan.days[selectedIdx];
        if (currentDay && currentDay.isCustom && currentDay.customPresetId === btn.dataset.pickPreset) return;
        const hasChecked = currentDay && currentDay.exercises.some(e => e.completed);
        if (hasChecked && !window.confirm('Bạn đã tick một số bài trong buổi này. Đổi sang nhóm cơ khác sẽ làm mới danh sách bài của ngày này?')) {
          return;
        }
        const res = Engine.applyCustomFocusToDay(state, selectedIdx, btn.dataset.pickPreset);
        if (res.ok) {
          saveState();
          renderWorkout();
          showToast(`Đã rải sẵn ${res.preset.exercises.length} bài tập cho ${currentDay.dayLabel}: ${res.preset.shortLabel}!`);
        }
      });
    });

    const restoreBtn = document.getElementById('restore-day-btn');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        if (Engine.restoreDayFromCustom(state, selectedIdx)) {
          saveState();
          renderWorkout();
          showToast('Đã khôi phục lại lịch gốc của ngày này.');
        }
      });
    }

    const startBtn = document.getElementById('start-session-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        Engine.startWorkoutSession(state.workoutPlan, selectedIdx, Date.now());
        saveState();
        renderWorkout();
        showToast('Đã bắt đầu buổi tập! Mốc tự động chốt sau 5 tiếng đã được lưu.');
      });
    }

    const finishBtn = document.getElementById('finish-session-btn');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        const res = Engine.completeSessionManually(state, selectedIdx, Date.now());
        if (res) {
          state.selectedWorkoutDay = res.nextDayIndex;
          saveState();
          renderWorkout();
          showToast(res.wrappedWeek
            ? 'Xuất sắc! Bạn đã hoàn thành trọn vẹn tuần tập và mở sang chu kỳ tuần mới.'
            : 'Đã lưu kết quả buổi tập và mở sẵn buổi tiếp theo!');
        }
      });
    }

    const jumpActiveBtn = document.getElementById('jump-active-workout-btn');
    if (jumpActiveBtn) {
      jumpActiveBtn.addEventListener('click', () => {
        state.selectedWorkoutDay = state.workoutPlan.activeDayIndex;
        saveState();
        renderWorkout();
      });
    }

    const changePlanBtn = document.getElementById('change-plan-btn');
    if (changePlanBtn) {
      changePlanBtn.addEventListener('click', () => {
        state.setupOpen = true;
        setTab('overview');
        const wiz = document.getElementById('setup-wizard');
        if (wiz) wiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    document.querySelectorAll('[data-ex-check]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const wasNotStarted = state.workoutPlan.days[selectedIdx].startedAt == null;
        Engine.toggleExercise(state.workoutPlan, selectedIdx, checkbox.dataset.exCheck, checkbox.checked, Date.now());
        saveState();
        renderWorkout();
        if (wasNotStarted && checkbox.checked) {
          showToast('Đã lưu giờ bắt đầu buổi tập (tự động chốt sau 5 tiếng).');
        }
      });
    });

    document.querySelectorAll('[data-ex-guide]').forEach(btn => {
      btn.addEventListener('click', () => openGuideModal(btn.dataset.exGuide));
    });
  }

  function openGuideModal(exId) {
    const ex = Data.EXERCISES[exId];
    if (!ex) return;

    document.getElementById('guide-modal-muscle').textContent = ex.muscle;
    document.getElementById('guide-modal-title').textContent = ex.name;
    document.getElementById('guide-modal-body').innerHTML = `
      <div class="kpi-grid" style="grid-template-columns:repeat(2,1fr); margin-bottom:2px;">
        <div class="kpi-box">
          <div class="kpi-label">Khối lượng gợi ý</div>
          <div class="kpi-value tabular" style="font-size:1.05rem;">${ex.sets} hiệp × ${escapeHtml(ex.reps)}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">Nghỉ giữa hiệp</div>
          <div class="kpi-value tabular" style="font-size:1.05rem;">${escapeHtml(ex.rest)}</div>
        </div>
      </div>
      <div class="guide-block">
        <h4>Tư thế chuẩn</h4>
        <p>${escapeHtml(ex.posture)}</p>
      </div>
      <div class="guide-block">
        <h4>Nhịp thở đúng</h4>
        <p>${escapeHtml(ex.breathing)}</p>
      </div>
      <div class="guide-block safety">
        <h4>Lưu ý tránh chấn thương</h4>
        <p>${escapeHtml(ex.safety)}</p>
      </div>
    `;
    const modal = document.getElementById('guide-modal');
    modal.hidden = false;
    modal.querySelector('.modal-close').focus();
  }

  // ==================== TAB 3: THỰC ĐƠN ====================
  function renderNutrition() {
    const container = document.getElementById('panel-nutrition');

    if (!state.weeklyMenu) {
      const targetKcal = state.assessment ? state.assessment.targetCalories : 1900;
      state.weeklyMenu = Engine.generateWeeklyMenu(state.dietMode, targetKcal, state.menuSeed);
      saveState();
    }

    const dayIdx = Number.isInteger(state.selectedMenuDay) && state.weeklyMenu[state.selectedMenuDay]
      ? state.selectedMenuDay
      : 0;
    const dayMenu = state.weeklyMenu[dayIdx];
    const totals = Engine.getDayNutritionTotals(dayMenu);
    const targetKcal = state.assessment ? state.assessment.targetCalories : totals.kcal;
    const totalMacroG = Math.max(1, totals.protein + totals.carbs + totals.fat);
    const pPct = Math.round((totals.protein / totalMacroG) * 100);
    const cPct = Math.round((totals.carbs / totalMacroG) * 100);
    const fPct = Math.max(0, 100 - pPct - cPct);

    const dayTabsHtml = state.weeklyMenu.map((d, idx) => `
      <button type="button" class="day-tab-btn" role="tab" data-menu-day="${idx}" aria-selected="${idx === dayIdx}">
        ${escapeHtml(d.dayLabel)}
      </button>
    `).join('');

    const mealCardsHtml = Engine.MEAL_SLOTS.map(slot => {
      const meal = dayMenu.meals[slot.key];
      const macroHtml = state.dietMode === 'strict'
        ? `
          <span class="macro-chip kcal tabular">${meal.kcal} kcal</span>
          <span class="macro-chip tabular">Đạm ${meal.protein}g</span>
          <span class="macro-chip tabular">Tinh bột ${meal.carbs}g</span>
          <span class="macro-chip tabular">Chất béo ${meal.fat}g</span>
        `
        : `
          <span class="macro-chip kcal tabular">~${meal.kcal} kcal</span>
          <span class="macro-chip tabular">Đạm ~${meal.protein}g</span>
          <span class="macro-chip">Dễ nấu tại nhà</span>
        `;

      return `
        <article class="meal-card">
          <div class="meal-card-head">
            <div>
              <span class="meal-slot-badge">${escapeHtml(slot.label)}</span>
              <span style="font-size:0.78rem; color:var(--text-muted); margin-left:6px;">${escapeHtml(slot.time)}</span>
            </div>
            <button type="button" class="btn btn-outline btn-sm" data-swap-meal="${slot.key}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              <span>Đổi món khác</span>
            </button>
          </div>
          <h3 class="meal-name">${escapeHtml(meal.name)}</h3>
          <p class="meal-portion"><strong>Khẩu phần:</strong> ${escapeHtml(meal.portion)}</p>
          <p class="meal-note">${escapeHtml(meal.note)}</p>
          <div class="macro-chips">${macroHtml}</div>
        </article>
      `;
    }).join('');

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h1 class="page-title">Thực đơn dinh dưỡng 7 ngày</h1>
          <p class="page-subtitle">Đổi món mỗi ngày không bị ngán — không hợp khẩu vị chỉ cần bấm "Đổi món khác".</p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" id="shuffle-week-menu-btn">Đổi mới cả tuần</button>
      </div>

      <div class="stack">
        <div class="diet-banner-switch" role="group" aria-label="Chọn chế độ ăn uống">
          <button type="button" class="choice-card" data-diet-mode="flexible" aria-pressed="${state.dietMode === 'flexible'}">
            <div class="choice-card-top">
              <strong>Linh hoạt (Cơm gia đình Việt)</strong>
              <span class="badge badge-accent">Dễ áp dụng</span>
            </div>
            <span>Món ăn quen thuộc, dễ mua dễ nấu, ước lượng khẩu phần đơn giản mà vẫn kiểm soát tốt năng lượng.</span>
          </button>
          <button type="button" class="choice-card" data-diet-mode="strict" aria-pressed="${state.dietMode === 'strict'}">
            <div class="choice-card-top">
              <strong>Khắt khe (Chuẩn Calo &amp; Macro)</strong>
              <span class="badge badge-info">Đo sát dinh dưỡng</span>
            </div>
            <span>Ưu tiên món luộc, hấp, áp chảo không dầu mỡ, hạn chế đường và tính chi tiết Đạm/Tinh bột/Chất béo.</span>
          </button>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">${escapeHtml(dayMenu.dayLabel)} — Năng lượng &amp; Dưỡng chất</h2>
            <span class="badge badge-neutral">Mục tiêu: ~${targetKcal.toLocaleString('vi-VN')} kcal</span>
          </div>

          <div class="kpi-grid" style="margin-bottom:0;">
            <div class="kpi-box">
              <div class="kpi-label">Tổng năng lượng thực đơn</div>
              <div class="kpi-value tabular" style="color:var(--accent);">${totals.kcal.toLocaleString('vi-VN')} <small style="font-size:0.76rem;">kcal</small></div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Tổng Đạm / Tinh bột / Béo</div>
              <div class="kpi-value tabular" style="font-size:1.05rem;">${totals.protein}g / ${totals.carbs}g / ${totals.fat}g</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Nước lọc nên uống</div>
              <div class="kpi-value tabular">${state.assessment ? (Math.round(state.assessment.weightKg * 0.035 * 10) / 10).toFixed(1) : '2.2'} <small style="font-size:0.76rem;">lít/ngày</small></div>
            </div>
          </div>

          <div class="macro-bar" aria-label="Tỷ lệ Đạm, Tinh bột, Chất béo">
            <div class="macro-p" style="width:${pPct}%;"></div>
            <div class="macro-c" style="width:${cPct}%;"></div>
            <div class="macro-f" style="width:${fPct}%;"></div>
          </div>
          <div class="macro-legend">
            <span class="legend-dot"><i style="background:#10B981;"></i>Đạm ${pPct}% (${totals.protein}g)</span>
            <span class="legend-dot"><i style="background:#0EA5E9;"></i>Tinh bột ${cPct}% (${totals.carbs}g)</span>
            <span class="legend-dot"><i style="background:#F59E0B;"></i>Chất béo ${fPct}% (${totals.fat}g)</span>
          </div>
        </div>

        <div>
          <div class="day-tabs" role="tablist" aria-label="Chọn ngày thực đơn">${dayTabsHtml}</div>
          <div class="meal-grid">${mealCardsHtml}</div>
        </div>
      </div>
    `;

    bindNutritionEvents(dayIdx);
  }

  function bindNutritionEvents(dayIdx) {
    document.querySelectorAll('[data-diet-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.dietMode;
        if (mode === state.dietMode) return;
        state.dietMode = mode;
        const targetKcal = state.assessment ? state.assessment.targetCalories : 1900;
        state.weeklyMenu = Engine.generateWeeklyMenu(state.dietMode, targetKcal, state.menuSeed);
        saveState();
        renderNutrition();
        showToast(mode === 'strict' ? 'Đã chuyển sang thực đơn Khắt khe (Chuẩn Macro).' : 'Đã chuyển sang thực đơn Linh hoạt (Cơm nhà).');
      });
    });

    document.querySelectorAll('[data-menu-day]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedMenuDay = Number(btn.dataset.menuDay);
        saveState();
        renderNutrition();
      });
    });

    document.querySelectorAll('[data-swap-meal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const slotKey = btn.dataset.swapMeal;
        const targetKcal = state.assessment ? state.assessment.targetCalories : 1900;
        const swapped = Engine.swapMeal(state.weeklyMenu, dayIdx, slotKey, state.dietMode, targetKcal);
        if (swapped) {
          saveState();
          renderNutrition();
          showToast(`Đã đổi sang: ${swapped.name}`);
        }
      });
    });

    const shuffleBtn = document.getElementById('shuffle-week-menu-btn');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        state.menuSeed = (state.menuSeed || 0) + 1;
        const targetKcal = state.assessment ? state.assessment.targetCalories : 1900;
        state.weeklyMenu = Engine.generateWeeklyMenu(state.dietMode, targetKcal, state.menuSeed);
        saveState();
        renderNutrition();
        showToast('Đã đổi mới thực đơn cả 7 ngày!');
      });
    }
  }

  // ==================== TAB 4: LỊCH SỬ TẬP ====================
  function renderHistory() {
    const container = document.getElementById('panel-history');
    const logs = state.history || [];

    const totalSessions = logs.length;
    const totalCompletedEx = logs.reduce((s, l) => s + l.completedCount, 0);
    const totalPlannedEx = logs.reduce((s, l) => s + l.totalCount, 0);
    const avgRate = totalPlannedEx > 0 ? Math.round((totalCompletedEx / totalPlannedEx) * 100) : 0;

    let listHtml = '';
    if (logs.length === 0) {
      listHtml = `
        <div class="card empty-card">
          <h3>Chưa có buổi tập nào được lưu</h3>
          <p>Sau khi bạn hoàn thành buổi tập hoặc hết mốc 5 tiếng tự động chốt, lịch sử chi tiết sẽ hiển thị tại đây.</p>
          <button type="button" class="btn btn-primary" id="goto-workout-from-history">Mở lịch tập ngay</button>
        </div>
      `;
    } else {
      listHtml = logs.map(item => {
        const pct = item.totalCount > 0 ? Math.round((item.completedCount / item.totalCount) * 100) : 0;
        const isAutoClosed = item.status === 'auto_closed';

        const doneLis = item.completedExercises.length > 0
          ? item.completedExercises.map(e => `<li>${escapeHtml(e.name)}</li>`).join('')
          : '<li>Chưa hoàn thành bài nào</li>';

        const missedBlock = item.missedExercises.length > 0
          ? `
            <div class="history-box missed">
              <strong>Bài tập đã bỏ lỡ (${item.missedExercises.length})</strong>
              <ul>${item.missedExercises.map(e => `<li>${escapeHtml(e.name)}</li>`).join('')}</ul>
            </div>
          `
          : '';

        return `
          <article class="history-item">
            <div class="history-head">
              <div>
                <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:4px;">
                  <span class="badge ${isAutoClosed ? 'badge-warning' : 'badge-success'}">
                    ${isAutoClosed ? 'Tự động chốt sau 5h' : 'Hoàn thành'}
                  </span>
                  <span style="font-size:0.81rem; color:var(--text-muted); font-weight:600;">
                    Tuần ${item.weekNumber} • ${escapeHtml(item.dayLabel)} • ${formatDateTime(item.closedAt)}
                  </span>
                </div>
                <h3 style="margin:0; font-size:1.02rem;">${escapeHtml(item.title)}</h3>
              </div>
              <div class="tabular" style="font-weight:800; font-size:1.05rem; color:${isAutoClosed ? 'var(--warning)' : 'var(--accent)'};">
                ${item.completedCount}/${item.totalCount} bài (${pct}%)
              </div>
            </div>
            <div class="history-lists">
              <div class="history-box">
                <strong>Đã hoàn thành (${item.completedExercises.length})</strong>
                <ul>${doneLis}</ul>
              </div>
              ${missedBlock}
            </div>
          </article>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h1 class="page-title">Lịch sử tập luyện</h1>
          <p class="page-subtitle">Xem lại các buổi đã hoàn thành và các bài bị bỏ lỡ để duy trì kỷ luật đều đặn.</p>
        </div>
        <button type="button" class="btn btn-danger-outline btn-sm" id="reset-all-btn">Xóa &amp; làm mới dữ liệu</button>
      </div>

      <div class="stack">
        <div class="kpi-grid">
          <div class="kpi-box">
            <div class="kpi-label">Tổng buổi đã chốt</div>
            <div class="kpi-value tabular">${totalSessions}</div>
            <div class="kpi-sub">Bao gồm cả buổi chốt sau 5h</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">Tỷ lệ hoàn thành trung bình</div>
            <div class="kpi-value tabular" style="color:var(--accent);">${avgRate}%</div>
            <div class="kpi-sub">Trên tổng số bài theo lịch</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">Tổng bài tập đã hoàn thành</div>
            <div class="kpi-value tabular">${totalCompletedEx}</div>
            <div class="kpi-sub">Cố gắng duy trì mỗi tuần!</div>
          </div>
        </div>

        <div class="stack">${listHtml}</div>
      </div>
    `;

    const goWorkout = document.getElementById('goto-workout-from-history');
    if (goWorkout) goWorkout.addEventListener('click', () => setTab('workout'));

    const resetBtn = document.getElementById('reset-all-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!window.confirm('Bạn có chắc muốn xóa toàn bộ chỉ số, lịch tập, thực đơn và lịch sử để bắt đầu lại từ đầu?')) return;
        state = Engine.createDefaultState();
        saveState();
        applyTheme();
        setTab('overview');
        showToast('Đã đặt lại toàn bộ dữ liệu.');
      });
    }
  }

  // ==================== 5-HOUR AUTO-CLOSE ALERT MODAL ====================
  function showPendingMissedAlertIfAny() {
    const alertData = state.pendingMissedAlert;
    const modal = document.getElementById('missed-modal');
    if (!alertData) {
      modal.hidden = true;
      return;
    }

    const missedItemsHtml = alertData.missedExercises.map(ex => `
      <li>
        <span>${escapeHtml(ex.name)}</span>
        <span class="tabular" style="font-size:0.8rem; color:var(--text-secondary);">${ex.sets} × ${escapeHtml(ex.reps)}</span>
      </li>
    `).join('');

    document.getElementById('missed-modal-body').innerHTML = `
      <p style="margin:0; font-size:0.93rem;">
        Đã quá <strong>5 tiếng</strong> kể từ lúc bạn bắt đầu buổi <strong>${escapeHtml(alertData.dayLabel)} — ${escapeHtml(alertData.sessionTitle)}</strong>
        (bắt đầu lúc ${formatTimeHHMM(alertData.startedAt)}). Hệ thống đã tự động chốt ở mức <strong>${alertData.completedCount}/${alertData.totalCount} bài</strong> và khóa buổi tập này lại.
      </p>

      <div>
        <div style="font-size:0.86rem; font-weight:700; margin-bottom:8px; color:var(--warning);">
          Các bài tập bạn đã bỏ lỡ (${alertData.missedExercises.length} bài):
        </div>
        <ul class="missed-list">${missedItemsHtml}</ul>
      </div>

      <div class="guide-block" style="border-left: 4px solid var(--accent);">
        <h4>Buổi tiếp theo đã sẵn sàng</h4>
        <p>Hệ thống đã chuyển sẵn sang <strong>${escapeHtml(alertData.nextDayLabel)}: ${escapeHtml(alertData.nextSessionTitle)}</strong>.</p>
      </div>
    `;

    modal.hidden = false;
    document.getElementById('open-next-session-btn').focus();
  }

  function runTimeoutCheck(showFeedbackIfAutoCompleted) {
    const res = Engine.checkSessionTimeout(state, Date.now());
    if (res.closed) {
      if (state.workoutPlan) state.selectedWorkoutDay = state.workoutPlan.activeDayIndex;
      saveState();
      renderActiveTab();
      if (res.hadMissed) {
        showPendingMissedAlertIfAny();
      } else if (showFeedbackIfAutoCompleted) {
        showToast('Buổi tập trước đã xong 100% và được tự động lưu sau 5 tiếng!');
      }
    } else if (state.pendingMissedAlert) {
      showPendingMissedAlertIfAny();
    }
  }

  // ==================== GLOBAL EVENTS & INIT ====================
  function bindGlobalEvents() {
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => setTab(btn.dataset.tab));
    });

    document.querySelector('.brand').addEventListener('click', e => {
      e.preventDefault();
      setTab('overview');
    });

    document.getElementById('theme-toggle').addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveState();
      applyTheme();
    });

    document.getElementById('sim-5h-btn').addEventListener('click', () => {
      const res = Engine.simulateFiveHoursPassed(state, Date.now());
      if (!res.ok) {
        if (res.reason === 'no_plan') {
          showToast('Hãy tạo lịch tập trước khi mô phỏng qua 5 tiếng.');
        } else {
          showToast('Hãy vào tab Lịch tập và bấm "Bắt đầu tập" hoặc tick 1 bài trước khi mô phỏng!');
        }
        return;
      }
      state.selectedWorkoutDay = state.workoutPlan.activeDayIndex;
      saveState();
      renderActiveTab();
      if (res.hadMissed) {
        showPendingMissedAlertIfAny();
      } else {
        showToast('Mô phỏng qua 5 tiếng: Bạn đã hoàn thành đủ 100% bài tập! Đã chuyển sang buổi tiếp theo.');
      }
    });

    document.getElementById('open-next-session-btn').addEventListener('click', () => {
      const nextIdx = state.pendingMissedAlert ? state.pendingMissedAlert.nextDayIndex : (state.workoutPlan ? state.workoutPlan.activeDayIndex : 0);
      state.pendingMissedAlert = null;
      state.selectedWorkoutDay = nextIdx;
      saveState();
      document.getElementById('missed-modal').hidden = true;
      setTab('workout');
    });

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.closeModal;
        document.getElementById(id).hidden = true;
        if (id === 'missed-modal') {
          state.pendingMissedAlert = null;
          saveState();
        }
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', e => {
        if (e.target === backdrop) {
          backdrop.hidden = true;
          if (backdrop.id === 'missed-modal') {
            state.pendingMissedAlert = null;
            saveState();
          }
        }
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop:not([hidden])').forEach(m => {
          m.hidden = true;
          if (m.id === 'missed-modal') {
            state.pendingMissedAlert = null;
            saveState();
          }
        });
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') runTimeoutCheck(true);
    });
    window.addEventListener('focus', () => runTimeoutCheck(true));
    setInterval(() => {
      runTimeoutCheck(true);
      if (state.activeTab === 'workout' && state.workoutPlan) {
        const day = state.workoutPlan.days[state.selectedWorkoutDay];
        const timerEl = document.getElementById('live-session-timer');
        if (day && !day.locked && day.startedAt != null && timerEl) {
          const remainingMs = Engine.FIVE_HOURS_MS - (Date.now() - day.startedAt);
          timerEl.textContent = `Bắt đầu ${formatTimeHHMM(day.startedAt)} • Tự động chốt sau ${formatRemaining(remainingMs)}`;
        }
      }
    }, 30000);
  }

  function init() {
    applyTheme();
    bindGlobalEvents();
    setTab(state.activeTab || 'overview');
    runTimeoutCheck(true);
  }

  init();
})();
