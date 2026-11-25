/* FitVita - Core business logic (pure, deterministic, testable) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./data.js'));
  } else {
    root.FitVitaEngine = factory(root.FitVitaData);
  }
}(typeof self !== 'undefined' ? self : this, function (Data) {
  'use strict';

  const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
  const STORAGE_KEY = 'fitvita_state_v1';
  const MEAL_SLOTS = [
    { key: 'breakfast', label: 'Bữa sáng', time: '07:00 – 08:30' },
    { key: 'lunch', label: 'Bữa trưa', time: '11:30 – 13:00' },
    { key: 'snack', label: 'Bữa phụ', time: '15:30 – 16:30' },
    { key: 'dinner', label: 'Bữa tối', time: '18:30 – 20:00' }
  ];

  function clamp(num, min, max) {
    return Math.min(max, Math.max(min, num));
  }

  // Ngưỡng BMI chuẩn Châu Á (IDI & WPRO) hiệu chỉnh riêng theo sinh lý Nam / Nữ
  const BMI_THRESHOLDS = {
    male: {
      under: 18.5,
      over: 23.5,
      obese: 27.0,
      normalMax: 23.4,
      overMax: 26.9,
      standardLabel: 'Chuẩn Châu Á cho Nam'
    },
    female: {
      under: 18.5,
      over: 22.0,
      obese: 25.0,
      normalMax: 21.9,
      overMax: 24.9,
      standardLabel: 'Chuẩn Châu Á cho Nữ'
    }
  };

  function getBmiThresholds(gender) {
    return gender === 'female' ? BMI_THRESHOLDS.female : BMI_THRESHOLDS.male;
  }

  // Ánh xạ BMI theo từng đoạn khớp chính xác với 4 vạch màu (0–25–50–75–100%) theo đúng giới tính
  function getBmiGaugePercent(bmi, gender) {
    const t = getBmiThresholds(gender);
    if (bmi <= 14) return 2;
    if (bmi < t.under) return clamp(((bmi - 14) / (t.under - 14)) * 25, 2, 24.5);
    if (bmi < t.over) return 25 + ((bmi - t.under) / (t.over - t.under)) * 25;
    if (bmi < t.obese) return 50 + ((bmi - t.over) / (t.obese - t.over)) * 25;
    const topMax = t.obese + 8;
    if (bmi < topMax) return 75 + ((bmi - t.obese) / (topMax - t.obese)) * 23;
    return 98;
  }

  function estimateBodyFat(bmiRaw, age, gender) {
    // Công thức Deurenberg chuẩn phân tách Nam/Nữ theo BMI & tuổi
    const sexVal = gender === 'male' ? 1 : 0;
    const pct = clamp(Math.round((1.2 * bmiRaw + 0.23 * age - 10.8 * sexVal - 5.4) * 10) / 10, 5, 60);
    let label;
    if (gender === 'male') {
      label = pct < 10 ? 'Mỡ rất thấp' : pct <= 20 ? 'Mỡ lý tưởng (Nam)' : pct <= 25 ? 'Hơi thừa mỡ' : 'Mỡ cao';
    } else {
      label = pct < 18 ? 'Mỡ rất thấp' : pct <= 26 ? 'Mỡ lý tưởng (Nữ)' : pct <= 31 ? 'Hơi thừa mỡ' : 'Mỡ cao';
    }
    return { bodyFatPct: pct, bodyFatLabel: label };
  }

  function assessBody(input) {
    const gender = input.gender === 'female' ? 'female' : 'male';
    const age = Number(input.age);
    const heightCm = Number(input.heightCm);
    const weightKg = Number(input.weightKg);

    if (!Number.isFinite(age) || age < 12 || age > 100) {
      throw new Error('Tuổi cần nằm trong khoảng 12 đến 100.');
    }
    if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) {
      throw new Error('Chiều cao cần nằm trong khoảng 100 đến 250 cm.');
    }
    if (!Number.isFinite(weightKg) || weightKg < 25 || weightKg > 250) {
      throw new Error('Cân nặng cần nằm trong khoảng 25 đến 250 kg.');
    }

    const activity = Data.ACTIVITY_LEVELS.find(a => a.id === input.activityId) || Data.ACTIVITY_LEVELS[1];
    const heightM = heightCm / 100;
    const bmiRaw = weightKg / (heightM * heightM);
    const bmi = Math.round(bmiRaw * 10) / 10;
    const thresholds = getBmiThresholds(gender);
    const { bodyFatPct, bodyFatLabel } = estimateBodyFat(bmiRaw, age, gender);

    // Công thức Mifflin-St Jeor
    const bmrRaw = 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : -161);
    const bmr = Math.round(bmrRaw);
    const tdee = Math.round(bmrRaw * activity.factor);

    const idealMin = Math.round(thresholds.under * heightM * heightM * 10) / 10;
    const idealMax = Math.round(thresholds.normalMax * heightM * heightM * 10) / 10;
    const genderName = gender === 'male' ? 'nam giới' : 'nữ giới';

    let category, categoryLabel, goal, goalLabel, targetCalories, statusTone, summary, advice;

    if (bmi < thresholds.under) {
      const surplus = gender === 'male' ? 350 : 250;
      category = 'underweight';
      categoryLabel = 'Thiếu cân';
      goal = 'gain';
      goalLabel = 'Tăng cân & phát triển cơ bắp lành mạnh';
      targetCalories = tdee + surplus;
      statusTone = 'info';
      const needKg = Math.max(0.5, Math.round((idealMin - weightKg) * 10) / 10);
      summary = `Với ${genderName} cao ${heightCm} cm, chỉ số BMI ${bmi} đang ở mức thiếu cân (mỡ ước tính ~${bodyFatPct}%). Vùng cân nặng chuẩn của bạn là ${idealMin}–${idealMax} kg (nên tăng thêm tối thiểu ~${needKg} kg).`;
      advice = `Cơ thể hiện hơi gầy và thiếu khối cơ dự trữ. Hãy ăn thặng dư nhẹ +${surplus} kcal/ngày giàu đạm và tập kháng lực đều để tăng cân săn chắc thay vì tích mỡ bụng.`;
    } else if (bmi < thresholds.over) {
      category = 'normal';
      categoryLabel = 'Cân đối';
      goal = 'maintain';
      goalLabel = 'Giữ dáng & tăng độ săn chắc';
      targetCalories = tdee;
      statusTone = 'success';
      summary = `Tuyệt vời! Theo ngưỡng chuẩn cho ${genderName} (${thresholds.under}–${thresholds.normalMax}), BMI ${bmi} (mỡ ước tính ~${bodyFatPct}%) nằm gọn trong vùng cân đối (${idealMin}–${idealMax} kg).`;
      advice = gender === 'male'
        ? 'Thể trạng bạn đang rất ổn. Duy trì mức calo quanh TDEE, tăng dần mức tạ và đủ đạm để phát triển cơ thân trên rõ nét và khỏe khoắn.'
        : 'Thể trạng bạn đang rất gọn gàng và cân đối. Duy trì mức năng lượng ổn định, ưu tiên tập săn chắc mông–đùi–eo và tăng độ dẻo dai.';
    } else if (bmi < thresholds.obese) {
      const deficit = gender === 'male' ? 450 : 350;
      const minFloor = gender === 'male' ? 1500 : 1200;
      category = 'overweight';
      categoryLabel = 'Thừa cân';
      goal = 'lose';
      goalLabel = 'Giảm mỡ khoa học & bảo toàn cơ bắp';
      targetCalories = Math.max(minFloor, tdee - deficit);
      statusTone = 'warning';
      const loseKg = Math.max(0.5, Math.round((weightKg - idealMax) * 10) / 10);
      summary = `Với ${genderName} cao ${heightCm} cm, BMI ${bmi} (mỡ ước tính ~${bodyFatPct}%) đã bước vào mức thừa cân — nặng hơn ngưỡng lý tưởng (${idealMin}–${idealMax} kg) khoảng ${loseKg} kg.`;
      advice = gender === 'male'
        ? `Nên tạo thâm hụt vừa phải khoảng ${deficit} kcal/ngày, giữ đủ đạm và tập tạ đều để đốt mỡ thừa mà vẫn bảo toàn khối cơ.`
        : `Nữ giới có tỷ lệ mỡ sinh lý cao hơn nam ở cùng BMI, nên mức này cần bắt đầu giảm mỡ nhẹ (~${deficit} kcal/ngày), kết hợp tập mông–đùi–core và kiểm soát tinh bột tinh chế.`;
    } else {
      const deficit = gender === 'male' ? 550 : 450;
      const minFloor = gender === 'male' ? 1600 : 1250;
      category = 'obese';
      categoryLabel = 'Béo phì';
      goal = 'lose';
      goalLabel = 'Giảm mỡ an toàn, ưu tiên bảo vệ khớp & tim mạch';
      targetCalories = Math.max(minFloor, tdee - deficit);
      statusTone = 'danger';
      const loseKg = Math.max(1, Math.round((weightKg - idealMax) * 10) / 10);
      summary = `Theo ngưỡng chuẩn Châu Á cho ${genderName} (≥ ${thresholds.obese}), BMI ${bmi} (mỡ ước tính ~${bodyFatPct}%) đang ở mức béo phì — vượt vùng lý tưởng (${idealMin}–${idealMax} kg) khoảng ${loseKg} kg.`;
      advice = `Cần ưu tiên giảm mỡ bền vững với mức thâm hụt ~${deficit} kcal/ngày, hạn chế đường và đồ chiên rán, kết hợp tập cường độ vừa phải và nghỉ phục hồi đầy đủ để bảo vệ khớp gối & tim mạch.`;
    }

    // Phân bổ Macro chuẩn theo mục tiêu (Đạm / Tinh bột / Chất béo)
    const proteinRatio = goal === 'lose' ? 0.32 : goal === 'gain' ? 0.28 : 0.30;
    const fatRatio = 0.25;
    const carbRatio = 1 - proteinRatio - fatRatio;

    const macros = {
      protein: Math.round((targetCalories * proteinRatio) / 4),
      carbs: Math.round((targetCalories * carbRatio) / 4),
      fat: Math.round((targetCalories * fatRatio) / 9)
    };

    return {
      gender,
      age,
      heightCm,
      weightKg,
      activityId: activity.id,
      activityLabel: activity.label,
      bmi,
      bmiGaugePercent: Math.round(getBmiGaugePercent(bmi, gender) * 10) / 10,
      thresholds,
      bodyFatPct,
      bodyFatLabel,
      bmr,
      tdee,
      idealMin,
      idealMax,
      category,
      categoryLabel,
      statusTone,
      goal,
      goalLabel,
      targetCalories,
      macros,
      summary,
      advice
    };
  }

  function resolveExercises(exIds) {
    return exIds.map(exId => {
      const base = Data.EXERCISES[exId];
      return {
        id: base.id,
        name: base.name,
        muscle: base.muscle,
        sets: base.sets,
        reps: base.reps,
        rest: base.rest,
        completed: false
      };
    });
  }

  function getTodayDayIndex(dateObj) {
    const d = dateObj instanceof Date ? dateObj : new Date();
    return (d.getDay() + 6) % 7; // 0 = Thứ 2 .. 6 = Chủ nhật
  }

  function buildWeeklySchedule(gender, frequency, weekNumber) {
    const safeGender = gender === 'female' ? 'female' : 'male';
    const safeFreq = [3, 4, 5, 6].includes(Number(frequency)) ? Number(frequency) : 4;
    const tpl = Data.WORKOUT_TEMPLATES[safeGender][safeFreq];

    const days = tpl.days.map((d, idx) => {
      if (d.isRest) {
        return {
          dayIndex: idx,
          dayLabel: Data.DAY_NAMES[idx],
          isRest: true,
          title: d.title,
          focus: d.focus,
          exercises: [],
          startedAt: null,
          endedAt: null,
          locked: false,
          status: 'rest'
        };
      }
      return {
        dayIndex: idx,
        dayLabel: Data.DAY_NAMES[idx],
        isRest: false,
        title: d.title,
        focus: d.focus,
        exercises: resolveExercises(d.exercises),
        startedAt: null,
        endedAt: null,
        locked: false,
        status: 'pending'
      };
    });

    const firstWorkoutIdx = days.findIndex(d => !d.isRest);
    return {
      gender: safeGender,
      frequency: safeFreq,
      splitName: tpl.splitName,
      focusNote: tpl.focusNote,
      weekNumber: weekNumber || 1,
      activeDayIndex: firstWorkoutIdx >= 0 ? firstWorkoutIdx : 0,
      days
    };
  }

  function applyCustomFocusToDay(state, dayIndex, presetId) {
    const preset = Data.CUSTOM_WORKOUT_PRESETS.find(p => p.id === presetId);
    if (!preset) return { ok: false, reason: 'invalid_preset' };

    if (!state.workoutPlan) {
      const gender = (state.profileInput && state.profileInput.gender) || 'male';
      state.workoutPlan = buildWeeklySchedule(gender, 4, 1);
    }

    const plan = state.workoutPlan;
    const targetIdx = Number.isInteger(dayIndex) && plan.days[dayIndex]
      ? dayIndex
      : getTodayDayIndex();
    const day = plan.days[targetIdx];
    if (day.locked) return { ok: false, reason: 'locked' };

    if (!day.isCustom) {
      day.originalSnapshot = {
        isRest: day.isRest,
        title: day.title,
        focus: day.focus,
        exercises: day.exercises.map(e => ({ ...e, completed: false }))
      };
    }

    day.isRest = false;
    day.isCustom = true;
    day.customPresetId = preset.id;
    day.title = preset.title;
    day.focus = preset.focus;
    day.exercises = resolveExercises(preset.exercises);
    day.startedAt = null;
    day.endedAt = null;
    day.status = 'pending';

    plan.activeDayIndex = targetIdx;
    state.selectedWorkoutDay = targetIdx;
    return { ok: true, dayIndex: targetIdx, preset };
  }

  function restoreDayFromCustom(state, dayIndex) {
    if (!state || !state.workoutPlan || !state.workoutPlan.days[dayIndex]) return false;
    const plan = state.workoutPlan;
    const day = plan.days[dayIndex];
    if (day.locked || !day.isCustom || !day.originalSnapshot) return false;

    const snap = day.originalSnapshot;
    day.isRest = snap.isRest;
    day.title = snap.title;
    day.focus = snap.focus;
    day.exercises = snap.exercises.map(e => ({ ...e, completed: false }));
    day.startedAt = null;
    day.endedAt = null;
    day.status = snap.isRest ? 'rest' : 'pending';
    delete day.isCustom;
    delete day.customPresetId;
    delete day.originalSnapshot;

    if (plan.activeDayIndex === dayIndex && day.isRest) {
      const { nextIndex } = findNextWorkoutDayIndex(plan.days, dayIndex);
      plan.activeDayIndex = nextIndex;
    }
    return true;
  }

  function findNextWorkoutDayIndex(days, fromDayIndex) {
    for (let i = fromDayIndex + 1; i < days.length; i++) {
      if (!days[i].isRest && !days[i].locked) {
        return { nextIndex: i, wrappedWeek: false };
      }
    }
    const first = days.findIndex(d => !d.isRest);
    return { nextIndex: first >= 0 ? first : 0, wrappedWeek: true };
  }

  function resetWeekForNewCycle(plan) {
    const fresh = buildWeeklySchedule(plan.gender, plan.frequency, (plan.weekNumber || 1) + 1);
    plan.weekNumber = fresh.weekNumber;
    plan.days = fresh.days;
    plan.activeDayIndex = fresh.activeDayIndex;
  }

  function startWorkoutSession(plan, dayIndex, nowMs) {
    if (!plan || !plan.days[dayIndex]) return false;
    const day = plan.days[dayIndex];
    if (day.isRest || day.locked) return false;
    if (day.startedAt == null) {
      day.startedAt = nowMs;
      day.status = 'in_progress';
      plan.activeDayIndex = dayIndex;
    }
    return true;
  }

  function toggleExercise(plan, dayIndex, exerciseId, checked, nowMs) {
    if (!plan || !plan.days[dayIndex]) return false;
    const day = plan.days[dayIndex];
    if (day.isRest || day.locked) return false;

    const ex = day.exercises.find(e => e.id === exerciseId);
    if (!ex) return false;

    if (checked && day.startedAt == null) {
      day.startedAt = nowMs;
      day.status = 'in_progress';
      plan.activeDayIndex = dayIndex;
    }
    ex.completed = Boolean(checked);
    return true;
  }

  function finalizeSession(state, dayIndex, reason, closedAtMs) {
    const plan = state.workoutPlan;
    const day = plan.days[dayIndex];
    const completedList = day.exercises.filter(e => e.completed);
    const missedList = day.exercises.filter(e => !e.completed);

    day.locked = true;
    day.endedAt = closedAtMs;
    day.status = (reason === 'auto_timeout' && missedList.length > 0) ? 'auto_closed' : 'completed';

    const historyEntry = {
      id: `log_${closedAtMs}_${dayIndex}`,
      weekNumber: plan.weekNumber || 1,
      dayIndex,
      dayLabel: day.dayLabel,
      title: day.title,
      startedAt: day.startedAt || closedAtMs,
      closedAt: closedAtMs,
      status: day.status,
      completedCount: completedList.length,
      totalCount: day.exercises.length,
      completedExercises: completedList.map(e => ({ id: e.id, name: e.name, sets: e.sets, reps: e.reps })),
      missedExercises: missedList.map(e => ({ id: e.id, name: e.name, sets: e.sets, reps: e.reps }))
    };

    state.history.unshift(historyEntry);

    const { nextIndex, wrappedWeek } = findNextWorkoutDayIndex(plan.days, dayIndex);
    let nextDayLabel, nextSessionTitle;

    if (wrappedWeek) {
      resetWeekForNewCycle(plan);
      const nextDay = plan.days[plan.activeDayIndex];
      nextDayLabel = `Tuần ${plan.weekNumber} • ${nextDay.dayLabel}`;
      nextSessionTitle = nextDay.title;
    } else {
      plan.activeDayIndex = nextIndex;
      const nextDay = plan.days[nextIndex];
      nextDayLabel = nextDay.dayLabel;
      nextSessionTitle = nextDay.title;
    }

    if (reason === 'auto_timeout' && missedList.length > 0) {
      state.pendingMissedAlert = {
        weekNumber: historyEntry.weekNumber,
        dayLabel: historyEntry.dayLabel,
        sessionTitle: historyEntry.title,
        startedAt: historyEntry.startedAt,
        closedAt: closedAtMs,
        completedCount: historyEntry.completedCount,
        totalCount: historyEntry.totalCount,
        missedExercises: historyEntry.missedExercises,
        nextDayIndex: plan.activeDayIndex,
        nextDayLabel,
        nextSessionTitle,
        wrappedWeek
      };
    }

    return { historyEntry, nextDayIndex: plan.activeDayIndex, wrappedWeek };
  }

  function completeSessionManually(state, dayIndex, nowMs) {
    if (!state || !state.workoutPlan || !state.workoutPlan.days[dayIndex]) return null;
    const day = state.workoutPlan.days[dayIndex];
    if (day.isRest || day.locked) return null;
    if (day.startedAt == null) day.startedAt = nowMs;
    return finalizeSession(state, dayIndex, 'manual', nowMs);
  }

  // Kiểm tra quy tắc tự động chốt sau đúng 5 tiếng kể từ lúc bắt đầu buổi tập
  function checkSessionTimeout(state, nowMs) {
    if (!state || !state.workoutPlan || !Array.isArray(state.workoutPlan.days)) {
      return { closed: false, hadMissed: false };
    }
    const plan = state.workoutPlan;
    for (let i = 0; i < plan.days.length; i++) {
      const day = plan.days[i];
      if (!day.isRest && !day.locked && typeof day.startedAt === 'number') {
        if (nowMs - day.startedAt >= FIVE_HOURS_MS) {
          const missedBefore = day.exercises.filter(e => !e.completed).length;
          finalizeSession(state, i, 'auto_timeout', day.startedAt + FIVE_HOURS_MS);
          return { closed: true, hadMissed: missedBefore > 0 };
        }
      }
    }
    return { closed: false, hadMissed: false };
  }

  // Mô phỏng thời gian trôi qua 5 tiếng để kiểm thử nhanh
  function simulateFiveHoursPassed(state, nowMs) {
    if (!state || !state.workoutPlan) {
      return { ok: false, reason: 'no_plan' };
    }
    const plan = state.workoutPlan;
    const activeInProgress = plan.days.find(d => !d.isRest && !d.locked && typeof d.startedAt === 'number');
    if (!activeInProgress) {
      return { ok: false, reason: 'not_started' };
    }
    // Lùi mốc startedAt về trước 5 tiếng + 1 giây để đúng kịch bản quay lại sau 5 tiếng
    activeInProgress.startedAt = nowMs - FIVE_HOURS_MS - 1000;
    const result = checkSessionTimeout(state, nowMs);
    return { ok: true, ...result };
  }

  function scaleMeal(meal, scaleFactor) {
    const f = clamp(scaleFactor, 0.8, 1.35);
    return {
      ...meal,
      kcal: Math.round((meal.kcal * f) / 5) * 5,
      protein: Math.round(meal.protein * f),
      carbs: Math.round(meal.carbs * f),
      fat: Math.round(meal.fat * f)
    };
  }

  function computeMenuScaleFactor(dietMode, targetCalories) {
    const baseDaily = dietMode === 'strict' ? 1500 : 1620;
    if (!targetCalories || !Number.isFinite(targetCalories)) return 1;
    return dietMode === 'strict'
      ? clamp(targetCalories / baseDaily, 0.85, 1.35)
      : clamp(targetCalories / baseDaily, 0.9, 1.25);
  }

  function generateWeeklyMenu(dietMode, targetCalories, seedOffset) {
    const mode = dietMode === 'strict' ? 'strict' : 'flexible';
    const pools = Data.MEAL_POOLS[mode];
    const scale = computeMenuScaleFactor(mode, targetCalories);
    const offset = Math.abs(Math.floor(seedOffset || 0));

    return Data.DAY_NAMES.map((dayLabel, dayIdx) => {
      const meals = {};
      MEAL_SLOTS.forEach((slot, slotIdx) => {
        const pool = pools[slot.key];
        // Bước nhảy nguyên tố cùng nhau với độ dài pool (9) giúp không trùng món trong cả 7 ngày
        const idx = (dayIdx + offset + slotIdx * 2) % pool.length;
        meals[slot.key] = scaleMeal(pool[idx], scale);
      });
      return { dayIndex: dayIdx, dayLabel, meals };
    });
  }

  function swapMeal(weeklyMenu, dayIndex, slotKey, dietMode, targetCalories) {
    if (!weeklyMenu || !weeklyMenu[dayIndex] || !weeklyMenu[dayIndex].meals[slotKey]) return null;
    const mode = dietMode === 'strict' ? 'strict' : 'flexible';
    const pool = Data.MEAL_POOLS[mode][slotKey];
    if (!pool || pool.length < 2) return null;

    const currentId = weeklyMenu[dayIndex].meals[slotKey].id;
    const prevId = dayIndex > 0 ? weeklyMenu[dayIndex - 1].meals[slotKey].id : null;
    const nextId = dayIndex < weeklyMenu.length - 1 ? weeklyMenu[dayIndex + 1].meals[slotKey].id : null;
    const currentIdx = pool.findIndex(m => m.id === currentId);

    let chosen = null;
    for (let step = 1; step <= pool.length; step++) {
      const candidate = pool[(Math.max(0, currentIdx) + step) % pool.length];
      if (candidate.id !== currentId && candidate.id !== prevId && candidate.id !== nextId) {
        chosen = candidate;
        break;
      }
    }
    if (!chosen) {
      chosen = pool[(Math.max(0, currentIdx) + 1) % pool.length];
    }

    const scale = computeMenuScaleFactor(mode, targetCalories);
    const scaled = scaleMeal(chosen, scale);
    weeklyMenu[dayIndex].meals[slotKey] = scaled;
    return scaled;
  }

  function getDayNutritionTotals(dayMenu) {
    return MEAL_SLOTS.reduce((acc, slot) => {
      const m = dayMenu.meals[slot.key];
      if (m) {
        acc.kcal += m.kcal;
        acc.protein += m.protein;
        acc.carbs += m.carbs;
        acc.fat += m.fat;
      }
      return acc;
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  }

  function createDefaultState() {
    return {
      version: 1,
      activeTab: 'overview',
      theme: 'light',
      colorTheme: 'emerald',
      profileInput: {
        gender: 'male',
        age: 26,
        heightCm: 172,
        weightKg: 68,
        activityId: 'light'
      },
      assessment: null,
      setupOpen: false,
      workoutPlan: null,
      selectedWorkoutDay: 0,
      dietMode: 'flexible',
      weeklyMenu: null,
      selectedMenuDay: 0,
      menuSeed: 0,
      pendingMissedAlert: null,
      history: []
    };
  }

  function sanitizeState(raw) {
    const base = createDefaultState();
    if (!raw || typeof raw !== 'object') return base;
    const merged = {
      ...base,
      ...raw,
      profileInput: { ...base.profileInput, ...(raw.profileInput || {}) },
      history: Array.isArray(raw.history) ? raw.history : []
    };
    // Tự động tính lại chỉ số đã lưu theo thang đo Nam/Nữ mới nhất để tránh kết quả cũ bị lệch
    if (merged.assessment) {
      try {
        merged.assessment = assessBody(merged.profileInput);
      } catch (_) {
        merged.assessment = null;
      }
    }
    return merged;
  }

  return {
    FIVE_HOURS_MS,
    STORAGE_KEY,
    MEAL_SLOTS,
    BMI_THRESHOLDS,
    getBmiThresholds,
    assessBody,
    getBmiGaugePercent,
    getTodayDayIndex,
    buildWeeklySchedule,
    applyCustomFocusToDay,
    restoreDayFromCustom,
    startWorkoutSession,
    toggleExercise,
    completeSessionManually,
    checkSessionTimeout,
    simulateFiveHoursPassed,
    generateWeeklyMenu,
    swapMeal,
    getDayNutritionTotals,
    createDefaultState,
    sanitizeState
  };
}));
