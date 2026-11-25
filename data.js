/* FitVita - Dữ liệu bài tập, lịch tập khoa học và thực đơn tiếng Việt */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FitVitaData = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  const ACTIVITY_LEVELS = [
    { id: 'sedentary', label: 'Ít vận động (văn phòng, ít tập thể dục)', factor: 1.2 },
    { id: 'light', label: 'Vận động nhẹ (tập nhẹ 1–3 buổi/tuần)', factor: 1.375 },
    { id: 'moderate', label: 'Vận động vừa (tập đều 3–5 buổi/tuần)', factor: 1.55 },
    { id: 'active', label: 'Vận động nhiều (tập nặng 6–7 buổi/tuần)', factor: 1.725 },
    { id: 'very_active', label: 'Rất năng động (lao động nặng / tập 2 buổi/ngày)', factor: 1.9 }
  ];

  // Thư viện bài tập chuẩn với hướng dẫn chi tiết, nhịp thở và phòng tránh chấn thương
  const EXERCISES = {
    bench_press: {
      id: 'bench_press',
      name: 'Đẩy ngực nằm với tạ (Bench Press)',
      muscle: 'Ngực, Vai trước, Tay sau',
      sets: 4, reps: '8–10 lần', rest: '90 giây',
      posture: 'Nằm ngửa trên ghế phẳng, hai chân đạp chắc xuống sàn, hơi ưỡn nhẹ lưng dưới và ép hai bả vai xuống ghế. Cầm tạ rộng hơn vai một chút, hạ tạ chậm về ngang giữa ngực rồi đẩy thẳng lên.',
      breathing: 'Hít sâu bằng mũi khi hạ tạ xuống ngực; thở mạnh bằng miệng khi đẩy tạ lên điểm cao nhất.',
      safety: 'Không dang khuỷu tay vuông góc 90° với thân người (giữ góc khoảng 45–60°) để bảo vệ khớp vai; luôn giữ cổ tay thẳng trục với cẳng tay.'
    },
    incline_db_press: {
      id: 'incline_db_press',
      name: 'Đẩy ngực trên ghế dốc với tạ đơn',
      muscle: 'Ngực trên, Vai trước',
      sets: 3, reps: '10–12 lần', rest: '75 giây',
      posture: 'Chỉnh ghế dốc 30–45°, tựa chắc lưng và đầu lên ghế. Giữ hai quả tạ đơn ngang ngực trên, đẩy lên theo quỹ đạo hơi khép vào nhau nhưng không đập hai tạ vào nhau.',
      breathing: 'Hít vào khi hạ tạ có kiểm soát; thở ra khi đẩy tạ lên.',
      safety: 'Không chỉnh ghế quá dốc (>45°) vì dễ dồn áp lực lên vai trước thay vì ngực trên; hạ tạ sâu vừa tầm khớp vai.'
    },
    push_up: {
      id: 'push_up',
      name: 'Chống đẩy chuẩn (Push-Up)',
      muscle: 'Ngực, Tay sau, Core',
      sets: 3, reps: '12–15 lần', rest: '60 giây',
      posture: 'Hai tay đặt rộng hơn vai một chút, thân người tạo thành một đường thẳng từ đầu đến gót chân, siết bụng và mông. Hạ ngực sát mặt sàn rồi đẩy người trở lại.',
      breathing: 'Hít vào khi hạ người xuống; thở ra đều khi đẩy người lên.',
      safety: 'Tránh võng lưng dưới hoặc đẩy hông quá cao; nữ hoặc người mới có thể hạ gối để giữ đúng form.'
    },
    ohp: {
      id: 'ohp',
      name: 'Đẩy vai qua đầu (Overhead Press)',
      muscle: 'Vai giữa, Vai trước, Tay sau',
      sets: 4, reps: '8–10 lần', rest: '90 giây',
      posture: 'Đứng chân rộng bằng vai hoặc ngồi thẳng lưng, giữ tạ ngang xương đòn, siết chặt cơ bụng. Đẩy tạ thẳng qua đầu cho đến khi cánh tay duỗi gần thẳng rồi hạ chậm xuống.',
      breathing: 'Hít sâu giữ chặt bụng trước khi đẩy; thở ra khi đưa tạ qua đỉnh đầu.',
      safety: 'Không ngả lưng ra sau quá mức khi đẩy tạ nặng để tránh chèn ép đốt sống thắt lưng.'
    },
    lateral_raise: {
      id: 'lateral_raise',
      name: 'Dang vai ngang với tạ đơn (Lateral Raise)',
      muscle: 'Vai giữa',
      sets: 3, reps: '12–15 lần', rest: '60 giây',
      posture: 'Đứng thẳng, hai tay cầm tạ đơn nhẹ hai bên hông, khuỷu tay hơi gập nhẹ. Nâng hai cánh tay sang ngang lên ngang vai, dừng 1 giây rồi hạ từ từ.',
      breathing: 'Thở ra khi nâng tay lên ngang vai; hít vào khi hạ tạ chậm xuống.',
      safety: 'Chọn mức tạ vừa phải, không nhún cầu vai hoặc đung đưa thân người để tránh căng cơ thang cổ.'
    },
    tricep_dip: {
      id: 'tricep_dip',
      name: 'Nhún xà kép / Ghế tập tay sau (Dips)',
      muscle: 'Tay sau, Ngực dưới',
      sets: 3, reps: '10–12 lần', rest: '60 giây',
      posture: 'Hai tay chống vững lên thành ghế hoặc xà kép, mở ngực, giữ vai hạ thấp xa tai. Gập khuỷu tay về phía sau đến khoảng 90° rồi dùng tay sau đẩy thẳng người lên.',
      breathing: 'Hít vào khi hạ thấp thân người; thở ra khi đẩy người trở lại.',
      safety: 'Không hạ vai quá sâu nếu cảm thấy căng mặt trước khớp vai; giữ khuỷu tay ép sát thân.'
    },
    pull_up: {
      id: 'pull_up',
      name: 'Kéo xà đơn / Kéo xô máy (Pull-Up / Lat Pulldown)',
      muscle: 'Lưng xô, Lưng giữa, Tay trước',
      sets: 4, reps: '8–12 lần', rest: '90 giây',
      posture: 'Nắm thanh xà rộng hơn vai một chút, lòng bàn tay hướng ra trước. Mở ngực, kéo khuỷu tay xuống sát sườn để đưa ngực tiến gần thanh xà, sau đó thả chậm.',
      breathing: 'Thở ra khi kéo người lên (hoặc kéo thanh xuống); hít vào khi duỗi tay có kiểm soát.',
      safety: 'Không giật người lấy đà hoặc gù vai về trước; ưu tiên cảm nhận cơ lưng xô thay vì kéo bằng cẳng tay.'
    },
    barbell_row: {
      id: 'barbell_row',
      name: 'Gập người kéo lưng (Bent-Over Row)',
      muscle: 'Lưng dày, Lưng giữa, Vai sau',
      sets: 4, reps: '8–10 lần', rest: '90 giây',
      posture: 'Chân rộng bằng vai, đẩy hông ra sau gập thân khoảng 45°, lưng giữ phẳng tuyệt đối. Kéo tạ về sát bụng dưới, ép chặt hai bả vai 1 giây rồi hạ xuống.',
      breathing: 'Thở ra khi kéo tạ về sát bụng; hít vào khi hạ tạ xuống.',
      safety: 'Tuyệt đối không cong lưng dưới; siết chặt bụng xuyên suốt hiệp tập để bảo vệ cột sống.'
    },
    seated_row: {
      id: 'seated_row',
      name: 'Ngồi kéo cáp / Dây kháng lực (Seated Row)',
      muscle: 'Lưng giữa, Xô, Vai sau',
      sets: 3, reps: '10–12 lần', rest: '60 giây',
      posture: 'Ngồi thẳng lưng, gối hơi chùng, tay nắm chắc tay kéo. Kéo khuỷu tay thẳng ra sau áp sát thân, ép hai bả vai vào nhau rồi nhả ra chậm rãi.',
      breathing: 'Thở ra khi kéo về bụng; hít vào khi duỗi tay về trước.',
      safety: 'Không ngả người ra sau quá xa khi kéo; giữ cổ trung tính nhìn thẳng phía trước.'
    },
    face_pull: {
      id: 'face_pull',
      name: 'Kéo dây ngang mặt (Face Pull)',
      muscle: 'Vai sau, Lưng trên, Ổn định khớp vai',
      sets: 3, reps: '15 lần', rest: '45 giây',
      posture: 'Cầm dây kháng lực hoặc cáp đặt ngang tầm ngực/mặt. Kéo dây về phía trán đồng thời tách hai tay sang ngang và xoay ngoài khớp vai.',
      breathing: 'Thở ra khi kéo dây và siết vai sau; hít vào khi trả dây chậm.',
      safety: 'Dùng lực vừa phải, tránh ưỡn bụng ra trước; rất tốt để chống gù lưng và bảo vệ vai.'
    },
    bicep_curl: {
      id: 'bicep_curl',
      name: 'Cuốn tạ đơn tay trước (Dumbbell Curl)',
      muscle: 'Tay trước (Biceps)',
      sets: 3, reps: '10–12 lần', rest: '60 giây',
      posture: 'Đứng thẳng, hai tay cầm tạ đơn dọc thân, cố định khuỷu tay sát sườn. Cuốn tạ lên ngang vai, siết cơ tay trước 1 giây rồi hạ xuống chậm trong 2–3 giây.',
      breathing: 'Thở ra khi cuốn tạ lên; hít vào khi hạ tạ xuống.',
      safety: 'Không đánh võng lưng lấy đà; giữ cổ tay vững không gập ngược.'
    },
    squat: {
      id: 'squat',
      name: 'Gánh tạ / Squat chuẩn (Squat)',
      muscle: 'Đùi trước, Mông, Core',
      sets: 4, reps: '8–12 lần', rest: '90 giây',
      posture: 'Chân rộng hơn vai một chút, mũi chân mở nhẹ 15–30°. Đẩy hông ra sau và hạ người xuống đến khi đùi song song mặt sàn, giữ ngực mở, đầu gối hướng theo mũi chân, rồi đạp gót đứng lên.',
      breathing: 'Hít sâu vào bụng trước khi hạ xuống; nín nhẹ ở đáy và thở mạnh khi đứng dậy.',
      safety: 'Không để đầu gối đổ chụm vào trong; giữ toàn bộ bàn chân bám chắc xuống sàn, không kiễng gót.'
    },
    rdl: {
      id: 'rdl',
      name: 'Deadlift kiểu Romania (Romanian Deadlift)',
      muscle: 'Đùi sau, Mông, Lưng dưới',
      sets: 4, reps: '10–12 lần', rest: '90 giây',
      posture: 'Chân rộng bằng hông, đầu gối hơi mềm (không khóa khớp). Giữ tạ sát đùi, đẩy hông thẳng ra sau đến khi cảm nhận đùi sau căng rõ rệt, lưng thẳng, rồi siết mông đẩy hông đứng thẳng.',
      breathing: 'Hít vào khi đẩy hông ra sau hạ tạ; thở ra khi siết mông đứng lên.',
      safety: 'Không hạ tạ quá thấp khiến lưng dưới bị cong; tạ luôn đi sát cẳng chân.'
    },
    hip_thrust: {
      id: 'hip_thrust',
      name: 'Đẩy hông nâng mông (Hip Thrust / Glute Bridge)',
      muscle: 'Mông lớn, Đùi sau',
      sets: 4, reps: '12–15 lần', rest: '75 giây',
      posture: 'Tựa phần lưng trên lên cạnh ghế chắc chắn (hoặc nằm sàn nếu tập Glute Bridge), hai bàn chân đặt rộng bằng hông sao cho khi đẩy lên cẳng chân vuông góc mặt sàn. Đẩy hông lên cao tạo đường thẳng từ vai tới gối, siết chặt mông 2 giây.',
      breathing: 'Thở ra mạnh khi đẩy hông lên đỉnh; hít vào khi hạ hông chậm xuống.',
      safety: 'Giữ cằm hơi thu nhẹ, mắt nhìn về phía trước để tránh ưỡn quá mức thắt lưng.'
    },
    bulgarian_split: {
      id: 'bulgarian_split',
      name: 'Squat một chân sau trên ghế (Bulgarian Split Squat)',
      muscle: 'Mông, Đùi trước, Thăng bằng',
      sets: 3, reps: '10–12 lần/chân', rest: '75 giây',
      posture: 'Đứng cách ghế khoảng 2 bàn chân, đặt mu bàn chân sau lên ghế. Hơi nghiêng thân trên về trước khoảng 15° (tăng ăn vào mông), hạ gối sau thẳng xuống gần sàn rồi đạp gót chân trước đứng lên.',
      breathing: 'Hít vào khi hạ người xuống; thở ra khi đạp đứng lên.',
      safety: 'Giữ gối chân trước ổn định không rung lắc vào trong; bắt đầu không tạ để làm quen thăng bằng.'
    },
    lunge: {
      id: 'lunge',
      name: 'Bước chùng chân (Reverse Lunge)',
      muscle: 'Mông, Đùi trước, Đùi sau',
      sets: 3, reps: '12 lần/chân', rest: '60 giây',
      posture: 'Đứng thẳng, bước dài một chân ra sau và hạ người đến khi cả hai đầu gối tạo góc khoảng 90°, thân trên thẳng. Đạp mạnh gót chân trước thu chân sau về vị trí ban đầu.',
      breathing: 'Hít vào khi bước lùi hạ gối; thở ra khi đứng dậy.',
      safety: 'Bước lùi (reverse) giúp giảm áp lực lên khớp gối hơn bước tới; không đập mạnh gối sau xuống sàn.'
    },
    glute_kickback: {
      id: 'glute_kickback',
      name: 'Đá chân sau siết mông (Glute Kickback)',
      muscle: 'Mông lớn, Mông trên',
      sets: 3, reps: '15 lần/chân', rest: '45 giây',
      posture: 'Chống hai tay và đầu gối trên thảm (hoặc đứng kéo dây kháng lực), giữ lưng phẳng, bụng siết. Đẩy một gót chân lên cao ra sau, giữ 1 giây ở đỉnh rồi hạ chậm.',
      breathing: 'Thở ra khi đá chân siết mông; hít vào khi thu chân về.',
      safety: 'Không võng lưng dưới để cố đá chân cao; chuyển động chỉ diễn ra ở khớp hông.'
    },
    clamshell: {
      id: 'clamshell',
      name: 'Mở hông vỏ sò với dây kháng lực (Clamshell)',
      muscle: 'Mông nhỡ (hõm hông), Ổn định hông',
      sets: 3, reps: '15–20 lần/bên', rest: '45 giây',
      posture: 'Nằm nghiêng, gối gập 45°, hai bàn chân chạm nhau, quấn dây miniband trên gối. Giữ hông cố định không ngả ra sau, mở đầu gối trên lên cao nhất có thể rồi đóng chậm.',
      breathing: 'Thở ra khi mở gối; hít vào khi hạ gối về.',
      safety: 'Giữ xương chậu thẳng đứng vuông góc mặt sàn để cô lập hoàn toàn cơ mông nhỡ.'
    },
    calf_raise: {
      id: 'calf_raise',
      name: 'Nhón gót bắp chân (Standing Calf Raise)',
      muscle: 'Bắp chân (Calves)',
      sets: 3, reps: '15–20 lần', rest: '45 giây',
      posture: 'Đứng mũi chân trên bục hoặc sàn phẳng, tay vịn nhẹ giữ thăng bằng. Kiễng gót lên hết biên độ, giữ 1 giây rồi hạ gót chậm để kéo giãn bắp chân.',
      breathing: 'Thở ra khi nhón lên; hít vào khi hạ gót.',
      safety: 'Chuyển động chậm có kiểm soát, không bật nảy nhanh làm căng gân gót Achilles.'
    },
    plank: {
      id: 'plank',
      name: 'Plank siết bụng (Forearm Plank)',
      muscle: 'Core toàn diện, Eo, Lưng dưới',
      sets: 3, reps: '45–60 giây', rest: '45 giây',
      posture: 'Chống hai khuỷu tay vuông góc ngay dưới vai, thân người tạo đường thẳng từ đầu tới gót chân. Cuộn nhẹ xương chậu, siết chặt bụng và mông.',
      breathing: 'Hít thở đều và sâu bằng mũi/miệng suốt thời gian giữ, tuyệt đối không nín thở.',
      safety: 'Dừng hiệp ngay nếu lưng dưới bắt đầu bị võng hoặc đau thắt lưng.'
    },
    dead_bug: {
      id: 'dead_bug',
      name: 'Đạp chân siết bụng sâu (Dead Bug)',
      muscle: 'Bụng sâu (TVA), Eo thon',
      sets: 3, reps: '12 lần/bên', rest: '45 giây',
      posture: 'Nằm ngửa, ép sát hoàn toàn thắt lưng xuống thảm, hai tay giơ thẳng trần nhà, gối gập 90°. Duỗi chậm tay phải và chân trái sát sàn rồi thu về, đổi bên.',
      breathing: 'Thở ra từ từ khi duỗi tay chân; hít vào khi thu về.',
      safety: 'Nếu thắt lưng bị hở khỏi sàn, hãy hạ chân ở góc cao hơn để bảo vệ cột sống.'
    },
    side_plank: {
      id: 'side_plank',
      name: 'Plank nghiêng săn cơ liên sườn (Side Plank)',
      muscle: 'Cơ chéo bụng (Eo), Ổn định hông',
      sets: 3, reps: '30–45 giây/bên', rest: '45 giây',
      posture: 'Nằm nghiêng chống khuỷu tay ngay dưới vai, nâng hông lên khỏi sàn sao cho vai–hông–cổ chân thẳng hàng. Có thể gập gối dưới nếu mới bắt đầu.',
      breathing: 'Hít thở đều, không gồng cứng cổ vai.',
      safety: 'Đẩy vai chống ra xa tai để không bị chèn ép khớp vai.'
    },
    mountain_climber: {
      id: 'mountain_climber',
      name: 'Leo núi đốt mỡ (Mountain Climber)',
      muscle: 'Core, Tim mạch (Cardio), Đùi',
      sets: 3, reps: '30–40 giây', rest: '45 giây',
      posture: 'Vào tư thế chống đẩy tay thẳng, siết chặt bụng. Luân phiên co nhanh đầu gối hướng về phía ngực mà vẫn giữ hông thấp ổn định.',
      breathing: 'Thở nhịp nhàng theo tốc độ chân, không nín thở.',
      safety: 'Giữ cổ tay ngay dưới vai và tiếp đất nhẹ bằng mũi chân để bảo vệ khớp cổ chân.'
    },
    jumping_jack: {
      id: 'jumping_jack',
      name: 'Bật nhảy tại chỗ (Jumping Jacks / Low-Impact Step)',
      muscle: 'Cardio toàn thân, Đốt mỡ',
      sets: 3, reps: '45 giây', rest: '30 giây',
      posture: 'Đứng thẳng khép chân, bật nhảy mở chân rộng hơn vai đồng thời vung hai tay lên quá đầu, rồi nhảy về vị trí ban đầu. Có thể bước ngang thay vì nhảy nếu muốn giảm chấn động gối.',
      breathing: 'Thở đều theo nhịp vung tay.',
      safety: 'Tiếp đất êm bằng phần đệm mũi chân, gối hơi chùng nhẹ.'
    },
    pilates_stretch: {
      id: 'pilates_stretch',
      name: 'Chuỗi giãn cơ Mèo–Bò & Tư thế Em bé (Mobility Flow)',
      muscle: 'Cột sống, Hông, Độ dẻo dai',
      sets: 2, reps: '60 giây', rest: '30 giây',
      posture: 'Chống bốn điểm thực hiện võng–cuộn lưng nhịp nhàng (Cat–Cow) trong 30 giây, sau đó lùi mông về gót duỗi dài hai tay phía trước (Child’s Pose) giữ sâu 30 giây.',
      breathing: 'Hít sâu khi mở ngực võng lưng; thở dài hết hơi khi cuộn tròn lưng và thư giãn.',
      safety: 'Thực hiện chậm rãi theo biên độ thoải mái, không giật mạnh.'
    },
    shoulder_arm_sculpt: {
      id: 'shoulder_arm_sculpt',
      name: 'Nâng tạ đôi kết hợp Vai & Tay sau (Arnold & Kickback)',
      muscle: 'Vai thon, Tay sau săn chắc',
      sets: 3, reps: '12–15 lần', rest: '60 giây',
      posture: 'Cầm cặp tạ nhẹ 2–4kg, đẩy xoay vai từ trước ngực lên cao, sau đó hơi gập thân giữ khuỷu tay cao ép sát sườn và duỗi thẳng tay sau về phía sau.',
      breathing: 'Thở ra ở pha đẩy lên và pha duỗi tay sau; hít vào ở pha hạ tạ.',
      safety: 'Dùng mức tạ nhẹ ưu tiên kiểm soát chậm để cánh tay thon gọn mà không gây đau khớp cổ tay.'
    },
    leg_raise: {
      id: 'leg_raise',
      name: 'Nâng chân nằm tập bụng dưới (Lying Leg Raise)',
      muscle: 'Bụng dưới, Core',
      sets: 3, reps: '12–15 lần', rest: '45 giây',
      posture: 'Nằm ngửa, hai tay đặt sát hông hỗ trợ giữ ổn định. Giữ hai chân duỗi thẳng (hoặc hơi chùng gối), nâng thẳng lên 90° rồi hạ chậm xuống cách sàn 10cm.',
      breathing: 'Thở ra khi nâng chân lên; hít vào khi hạ chân có kiểm soát.',
      safety: 'Ép sát thắt lưng xuống thảm; dừng hạ chân ngay khi thấy lưng dưới có xu hướng cong lên.'
    }
  };

  // Gợi ý chăm sóc sức khỏe ngày nghỉ (Rest Day)
  const REST_DAY_TIPS = [
    { icon: 'moon', title: 'Ngủ đủ 7–8 tiếng', desc: 'Cơ bắp thực sự phát triển và hồi phục sợi cơ khi bạn ngủ sâu, đặc biệt trong khung giờ 23h–3h.' },
    { icon: 'droplet', title: 'Uống đủ 2–2,5 lít nước', desc: 'Bổ sung nước lọc và điện giải tự nhiên giúp đào thải axit lactic, giảm đau mỏi cơ sau buổi tập.' },
    { icon: 'stretch', title: 'Giãn cơ nhẹ & đi bộ 15–20 phút', desc: 'Vận động cường độ rất thấp (active recovery) tăng tuần hoàn máu mà không gây áp lực lên khớp.' },
    { icon: 'nutrition', title: 'Vẫn ăn đủ đạm & rau xanh', desc: 'Đừng cắt bỏ bữa ăn ngày nghỉ; duy trì đủ protein giúp cơ thể tái tạo mô cơ tối ưu.' }
  ];

  // Mẫu lịch tập theo Giới tính × Tần suất (3, 4, 5, 6 buổi/tuần) trên khung 7 ngày (0 = Thứ 2 .. 6 = Chủ nhật)
  const WORKOUT_TEMPLATES = {
    male: {
      3: {
        splitName: 'Full Body 3 buổi (Tăng cơ toàn thân & Sức mạnh)',
        focusNote: 'Tối ưu phát triển sức mạnh tổng thể, ưu tiên các bài đa khớp cho ngực, lưng, vai và chân kết hợp 4 ngày phục hồi.',
        days: [
          { isRest: false, title: 'Full Body A — Ngực, Lưng & Chân', focus: 'Đẩy & Sức mạnh toàn thân', exercises: ['bench_press', 'barbell_row', 'squat', 'lateral_raise', 'plank'] },
          { isRest: true, title: 'Nghỉ ngơi & Phục hồi', focus: 'Tái tạo sợi cơ sau buổi nặng' },
          { isRest: false, title: 'Full Body B — Vai, Xô & Đùi sau', focus: 'Thân trên & Chuỗi cơ sau', exercises: ['ohp', 'pull_up', 'rdl', 'bicep_curl', 'leg_raise'] },
          { isRest: true, title: 'Nghỉ ngơi & Phục hồi', focus: 'Giãn cơ nhẹ & phục hồi hệ thần kinh' },
          { isRest: false, title: 'Full Body C — Ngực trên, Lưng & Tay', focus: 'Hoàn thiện thân trên & Core', exercises: ['incline_db_press', 'seated_row', 'lunge', 'tricep_dip', 'face_pull'] },
          { isRest: true, title: 'Nghỉ ngơi chủ động', focus: 'Đi bộ thư giãn, giãn cơ' },
          { isRest: true, title: 'Nghỉ phục hồi cuối tuần', focus: 'Chuẩn bị thể lực cho tuần mới' }
        ]
      },
      4: {
        splitName: 'Upper / Lower 4 buổi (Thân trên — Thân dưới)',
        focusNote: 'Cân bằng hoàn hảo giữa khối lượng tập thân trên (ngực, vai, lưng, tay) và nền tảng sức mạnh thân dưới.',
        days: [
          { isRest: false, title: 'Thân trên A — Ngực & Lưng sức mạnh', focus: 'Ngực, Lưng, Tay trước/sau', exercises: ['bench_press', 'barbell_row', 'ohp', 'bicep_curl', 'tricep_dip'] },
          { isRest: false, title: 'Thân dưới A — Đùi & Core', focus: 'Chân toàn diện & Bụng', exercises: ['squat', 'rdl', 'lunge', 'calf_raise', 'plank'] },
          { isRest: true, title: 'Nghỉ ngơi giữa tuần', focus: 'Phục hồi khớp và cơ bắp' },
          { isRest: false, title: 'Thân trên B — Vai, Xô & Ngực trên', focus: 'Độ rộng lưng & vai săn chắc', exercises: ['incline_db_press', 'pull_up', 'lateral_raise', 'seated_row', 'face_pull'] },
          { isRest: false, title: 'Thân dưới B — Sức mạnh chân & Bụng dưới', focus: 'Mông, Đùi & Core', exercises: ['bulgarian_split', 'rdl', 'hip_thrust', 'calf_raise', 'leg_raise'] },
          { isRest: true, title: 'Nghỉ ngơi chủ động', focus: 'Giãn cơ, ngủ đủ giấc' },
          { isRest: true, title: 'Nghỉ phục hồi cuối tuần', focus: 'Nạp năng lượng cho tuần mới' }
        ]
      },
      5: {
        splitName: 'Push / Pull / Legs + Upper / Core (5 buổi)',
        focusNote: 'Tăng tần suất kích thích nhóm cơ ngực, vai, lưng, tay giúp xây dựng cơ bắp rõ nét với 2 ngày nghỉ hợp lý.',
        days: [
          { isRest: false, title: 'Push — Đẩy (Ngực, Vai, Tay sau)', focus: 'Phát triển cơ đẩy thân trên', exercises: ['bench_press', 'incline_db_press', 'ohp', 'lateral_raise', 'tricep_dip'] },
          { isRest: false, title: 'Pull — Kéo (Lưng xô, Vai sau, Tay trước)', focus: 'Độ rộng và dày cơ lưng', exercises: ['pull_up', 'barbell_row', 'seated_row', 'face_pull', 'bicep_curl'] },
          { isRest: false, title: 'Legs — Chân & Bụng', focus: 'Sức mạnh phần thân dưới', exercises: ['squat', 'rdl', 'lunge', 'calf_raise', 'plank'] },
          { isRest: true, title: 'Nghỉ ngơi giữa tuần', focus: 'Phục hồi hệ thần kinh trung ương' },
          { isRest: false, title: 'Upper — Thân trên toàn diện', focus: 'Tăng khối lượng ngực, lưng, tay', exercises: ['push_up', 'pull_up', 'lateral_raise', 'bicep_curl', 'tricep_dip'] },
          { isRest: false, title: 'Athletic Core & Thân dưới', focus: 'Sức bền, cơ bụng & thăng bằng', exercises: ['bulgarian_split', 'hip_thrust', 'mountain_climber', 'leg_raise', 'side_plank'] },
          { isRest: true, title: 'Nghỉ phục hồi toàn diện', focus: 'Thư giãn hoàn toàn, tránh quá tải' }
        ]
      },
      6: {
        splitName: 'Push / Pull / Legs × 2 (6 buổi nâng cao)',
        focusNote: 'Lịch tập tối đa tốc độ tăng cơ cho nam: mỗi nhóm cơ lớn được kích thích 2 lần/tuần và 1 ngày nghỉ trọn vẹn.',
        days: [
          { isRest: false, title: 'Push A — Ngực & Vai sức mạnh', focus: 'Ưu tiên mức tạ và form chuẩn', exercises: ['bench_press', 'ohp', 'incline_db_press', 'lateral_raise', 'tricep_dip'] },
          { isRest: false, title: 'Pull A — Lưng dày & Tay trước', focus: 'Lưng giữa và cơ bắp tay', exercises: ['barbell_row', 'pull_up', 'face_pull', 'bicep_curl', 'plank'] },
          { isRest: false, title: 'Legs A — Đùi trước & Bắp chân', focus: 'Squat và sức mạnh chân', exercises: ['squat', 'bulgarian_split', 'rdl', 'calf_raise', 'leg_raise'] },
          { isRest: false, title: 'Push B — Ngực trên & Tay sau', focus: 'Hoàn thiện độ nét cơ đẩy', exercises: ['incline_db_press', 'push_up', 'ohp', 'lateral_raise', 'tricep_dip'] },
          { isRest: false, title: 'Pull B — Lưng xô rộng & Vai sau', focus: 'Tạo dáng chữ V thân trên', exercises: ['pull_up', 'seated_row', 'barbell_row', 'face_pull', 'bicep_curl'] },
          { isRest: false, title: 'Legs B — Đùi sau, Mông & Core', focus: 'Chuỗi cơ sau và cơ bụng', exercises: ['rdl', 'lunge', 'hip_thrust', 'calf_raise', 'side_plank'] },
          { isRest: true, title: 'Nghỉ phục hồi toàn diện', focus: 'Ngủ sâu, giãn cơ toàn thân' }
        ]
      }
    },
    female: {
      3: {
        splitName: 'Full Body Săn chắc 3 buổi (Mông, Đùi, Eo & Đốt mỡ)',
        focusNote: 'Tối ưu đốt mỡ và định hình đường cong mông–đùi–eo với lịch 3 buổi xen kẽ ngày nghỉ khoa học.',
        days: [
          { isRest: false, title: 'Full Body A — Mông, Đùi & Bụng sâu', focus: 'Nâng mông, săn đùi & giữ eo', exercises: ['hip_thrust', 'squat', 'glute_kickback', 'push_up', 'dead_bug'] },
          { isRest: true, title: 'Nghỉ ngơi & Phục hồi', focus: 'Giãn cơ nhẹ, uống đủ nước' },
          { isRest: false, title: 'Full Body B — Đốt mỡ & Thân trên thon gọn', focus: 'Vai tay săn chắc, lưng đẹp', exercises: ['lunge', 'seated_row', 'shoulder_arm_sculpt', 'mountain_climber', 'side_plank'] },
          { isRest: true, title: 'Nghỉ ngơi & Phục hồi', focus: 'Đi bộ thư giãn, ngủ đủ giấc' },
          { isRest: false, title: 'Full Body C — Mông nhỡ, Đùi sau & Dẻo dai', focus: 'Định hình hông & tăng độ linh hoạt', exercises: ['rdl', 'bulgarian_split', 'clamshell', 'plank', 'pilates_stretch'] },
          { isRest: true, title: 'Nghỉ ngơi chủ động', focus: 'Yoga nhẹ hoặc đi bộ' },
          { isRest: true, title: 'Nghỉ phục hồi cuối tuần', focus: 'Chăm sóc cơ thể, chuẩn bị tuần mới' }
        ]
      },
      4: {
        splitName: 'Lower Glutes / Upper Tone 4 buổi',
        focusNote: 'Hai buổi chuyên sâu mông–đùi xen kẽ hai buổi săn chắc thân trên, eo thon và tăng độ dẻo dai.',
        days: [
          { isRest: false, title: 'Mông & Đùi A — Sức mạnh thân dưới', focus: 'Mông lớn, Đùi trước & Hông', exercises: ['hip_thrust', 'squat', 'bulgarian_split', 'clamshell', 'plank'] },
          { isRest: false, title: 'Thân trên thon gọn & Core A', focus: 'Lưng thẳng, tay thon, bụng phẳng', exercises: ['seated_row', 'push_up', 'shoulder_arm_sculpt', 'face_pull', 'dead_bug'] },
          { isRest: true, title: 'Nghỉ ngơi giữa tuần', focus: 'Phục hồi nhóm cơ mông và đùi' },
          { isRest: false, title: 'Mông & Đùi sau B — Tạo dáng săn chắc', focus: 'Đùi sau, mông trên & chân thon', exercises: ['rdl', 'lunge', 'glute_kickback', 'calf_raise', 'side_plank'] },
          { isRest: false, title: 'Eo thon, Cardio đốt mỡ & Dẻo dai', focus: 'Đốt calo, săn eo & giãn cơ', exercises: ['jumping_jack', 'mountain_climber', 'leg_raise', 'dead_bug', 'pilates_stretch'] },
          { isRest: true, title: 'Nghỉ ngơi chủ động', focus: 'Uống đủ nước, giãn cơ nhẹ' },
          { isRest: true, title: 'Nghỉ phục hồi cuối tuần', focus: 'Nghỉ ngơi trọn vẹn' }
        ]
      },
      5: {
        splitName: 'Glutes & Core Sculpt 5 buổi',
        focusNote: 'Tần suất lý tưởng cho nữ muốn giảm mỡ rõ rệt, nâng cơ mông tròn đẹp và giữ độ dẻo dai mỗi tuần.',
        days: [
          { isRest: false, title: 'Mông & Đùi trước chuyên sâu', focus: 'Tăng săn chắc mông lớn & đùi', exercises: ['hip_thrust', 'squat', 'lunge', 'clamshell', 'plank'] },
          { isRest: false, title: 'Thân trên thon gọn & Tư thế đẹp', focus: 'Vai, cánh tay và lưng trên', exercises: ['seated_row', 'shoulder_arm_sculpt', 'push_up', 'face_pull', 'pilates_stretch'] },
          { isRest: false, title: 'Core, Eo thon & Cardio đốt mỡ', focus: 'Siết vòng eo & tăng nhịp tim', exercises: ['jumping_jack', 'mountain_climber', 'dead_bug', 'side_plank', 'leg_raise'] },
          { isRest: true, title: 'Nghỉ ngơi giữa tuần', focus: 'Tái tạo năng lượng & giãn cơ' },
          { isRest: false, title: 'Mông & Đùi sau tạo đường cong', focus: 'Chuỗi cơ sau & hõm hông', exercises: ['rdl', 'bulgarian_split', 'glute_kickback', 'clamshell', 'calf_raise'] },
          { isRest: false, title: 'Toàn thân đốt mỡ & Dẻo dai', focus: 'Kết hợp săn chắc và giải phóng khớp', exercises: ['squat', 'push_up', 'mountain_climber', 'plank', 'pilates_stretch'] },
          { isRest: true, title: 'Nghỉ phục hồi toàn diện', focus: 'Ngủ sâu & phục hồi cơ bắp' }
        ]
      },
      6: {
        splitName: 'Săn chắc toàn diện & Đốt mỡ 6 buổi',
        focusNote: 'Lịch tập năng động 6 buổi chia nhỏ nhóm cơ hợp lý để duy trì tiêu hao năng lượng cao mà không quá tải một vùng cơ.',
        days: [
          { isRest: false, title: 'Mông & Đùi A — Sức mạnh', focus: 'Mông lớn & đùi săn chắc', exercises: ['hip_thrust', 'squat', 'lunge', 'clamshell', 'calf_raise'] },
          { isRest: false, title: 'Thân trên & Tay thon A', focus: 'Cánh tay gọn và vai đẹp', exercises: ['push_up', 'seated_row', 'shoulder_arm_sculpt', 'face_pull', 'plank'] },
          { isRest: false, title: 'Eo thon & Cardio đốt mỡ A', focus: 'Đốt mỡ bụng & tăng sức bền', exercises: ['jumping_jack', 'mountain_climber', 'dead_bug', 'side_plank', 'pilates_stretch'] },
          { isRest: false, title: 'Mông & Đùi sau B — Định hình', focus: 'Đùi sau & mông trên', exercises: ['rdl', 'bulgarian_split', 'glute_kickback', 'clamshell', 'leg_raise'] },
          { isRest: false, title: 'Lưng vai đẹp & Giãn cơ B', focus: 'Chống gù lưng & tăng dẻo dai', exercises: ['pull_up', 'seated_row', 'lateral_raise', 'face_pull', 'pilates_stretch'] },
          { isRest: false, title: 'Toàn thân săn chắc & Core B', focus: 'Hoàn thiện đốt mỡ cuối tuần', exercises: ['hip_thrust', 'lunge', 'jumping_jack', 'dead_bug', 'side_plank'] },
          { isRest: true, title: 'Nghỉ phục hồi toàn diện', focus: 'Ngủ đủ giấc, giãn cơ nhẹ nhàng' }
        ]
      }
    }
  };

  // Ngân hàng thực đơn phong phú (2 chế độ: strict - Khắt khe, flexible - Không khắt khe/Linh hoạt)
  // Mỗi bữa có 9 món để xoay vòng cả 7 ngày không trùng lặp và bấm "Đổi món khác" luôn có lựa chọn mới.
  const MEAL_POOLS = {
    strict: {
      breakfast: [
        { id: 'sb1', name: 'Yến mạch nấu nước + 2 trứng luộc + chuối nửa quả', portion: '50g yến mạch, 2 trứng, 60g chuối', kcal: 390, protein: 22, carbs: 48, fat: 11, note: 'Không đường, ưu tiên luộc & nấu chín tới.' },
        { id: 'sb2', name: 'Bánh mì nguyên cám + ức gà áp chảo không dầu + xà lách', portion: '2 lát bánh mì đen, 100g ức gà, rau xanh', kcal: 380, protein: 34, carbs: 40, fat: 7, note: 'Áp chảo chảo chống dính với tiêu và lá thơm.' },
        { id: 'sb3', name: 'Khoai lang mật hấp + 3 lòng trắng & 1 trứng nguyên ốp không dầu', portion: '150g khoai lang, 4 quả trứng (1 lòng đỏ)', kcal: 360, protein: 24, carbs: 46, fat: 7, note: 'Hấp chín tự nhiên, không nêm sốt béo.' },
        { id: 'sb4', name: 'Sữa chua Hy Lạp không đường + hạt chia + việt quất + yến mạch', portion: '150g sữa chua, 30g yến mạch, 10g hạt chia', kcal: 350, protein: 22, carbs: 42, fat: 9, note: 'Giàu lợi khuẩn, no lâu, không đường tinh luyện.' },
        { id: 'sb5', name: 'Đậu hũ non hấp trứng + 1 lát bánh mì đen + dưa leo', portion: '150g đậu hũ, 2 trứng, 1 lát bánh mì', kcal: 370, protein: 26, carbs: 32, fat: 14, note: 'Đạm sạch dễ tiêu hóa, nêm rất ít nước tương.' },
        { id: 'sb6', name: 'Bún gạo lứt trộn ức gà xé + dưa leo + giá đỗ trụng', portion: '60g bún gạo lứt khô, 100g ức gà luộc', kcal: 395, protein: 32, carbs: 50, fat: 6, note: 'Trộn nước cốt chanh, tỏi ớt thay vì dầu hành.' },
        { id: 'sb7', name: 'Cháo yến mạch thịt nạc thăn bằm + hành ngò', portion: '50g yến mạch, 90g thịt heo nạc thăn', kcal: 375, protein: 29, carbs: 42, fat: 8, note: 'Không phi dầu mỡ, nêm nhạt vừa vị.' },
        { id: 'sb8', name: 'Tôm hấp sả + bắp Mỹ luộc + cà chua bi', portion: '120g tôm bóc vỏ, 1 trái bắp nhỏ, 100g cà chua', kcal: 355, protein: 30, carbs: 46, fat: 4, note: 'Hấp nguyên vị, giữ trọn dưỡng chất.' },
        { id: 'sb9', name: 'Bánh pancake yến mạch chuối trứng áp chảo không dầu', portion: '45g yến mạch xay, 2 trứng, 1 quả chuối nhỏ', kcal: 385, protein: 20, carbs: 50, fat: 11, note: 'Không rưới mật ong hay siro ngọt.' }
      ],
      lunch: [
        { id: 'sl1', name: 'Cơm gạo lứt + Ức gà áp chảo chanh tiêu + Bông cải xanh luộc', portion: '130g cơm gạo lứt, 150g ức gà, 150g bông cải', kcal: 520, protein: 48, carbs: 54, fat: 10, note: 'Áp chảo không dầu, luộc rau chín tới giữ độ giòn.' },
        { id: 'sl2', name: 'Cơm gạo lứt + Cá hồi nướng giấy bạc + Măng tây hấp', portion: '120g cơm gạo lứt, 130g cá hồi, 150g măng tây', kcal: 545, protein: 38, carbs: 48, fat: 21, note: 'Giàu Omega-3 tự nhiên, chỉ ướp muối tiêu chanh.' },
        { id: 'sl3', name: 'Khoai lang hấp + Thịt bò thăn áp chảo + Salad rau mầm giấm táo', portion: '180g khoai lang, 140g thăn bò, 120g rau trộn', kcal: 510, protein: 40, carbs: 56, fat: 12, note: 'Dùng 1 thìa nhỏ dầu ô liu ép lạnh cho salad.' },
        { id: 'sl4', name: 'Cơm gạo lứt + Phi lê cá basa hấp gừng hành + Đậu bắp luộc', portion: '140g cơm gạo lứt, 160g cá basa nạc, 150g đậu bắp', kcal: 495, protein: 38, carbs: 56, fat: 11, note: 'Hấp cách thủy không dầu mỡ, rất nhẹ bụng.' },
        { id: 'sl5', name: 'Nui gạo lứt luộc + Tôm áp chảo tỏi + Bí ngòi nướng', portion: '70g nui khô, 150g tôm tươi, 150g bí ngòi', kcal: 505, protein: 40, carbs: 64, fat: 7, note: 'Nướng bí ngòi bằng nồi chiên không dầu.' },
        { id: 'sl6', name: 'Cơm gạo lứt + Thăn heo luộc cuốn rau sống chấm mắm tỏi ớt nhạt', portion: '130g cơm gạo lứt, 140g thăn heo, 150g rau xanh', kcal: 515, protein: 42, carbs: 54, fat: 12, note: 'Lọc bỏ hoàn toàn phần mỡ bì.' },
        { id: 'sl7', name: 'Miến dong trộn ức gà luộc + nấm đùi gà áp chảo + cải thìa', portion: '65g miến khô, 150g ức gà, 120g nấm & cải', kcal: 485, protein: 46, carbs: 58, fat: 6, note: 'Trụng miến ráo nước, không dùng mỡ hành.' },
        { id: 'sl8', name: 'Cơm gạo lứt + Cá thu Nhật nướng nồi chiên + Canh bí đao', portion: '130g cơm gạo lứt, 130g cá thu, 1 bát canh bí', kcal: 535, protein: 36, carbs: 52, fat: 19, note: 'Canh nấu thanh đạm không nêm dầu.' },
        { id: 'sl9', name: 'Khoai tây bi hấp + Trứng luộc + Ức vịt bỏ da áp chảo + Rau củ hấp', portion: '200g khoai tây, 130g ức vịt bỏ da, 150g rau', kcal: 525, protein: 42, carbs: 55, fat: 13, note: 'Tách sạch lớp da mỡ trước khi chế biến.' }
      ],
      snack: [
        { id: 'sn1', name: 'Sữa chua không đường + 15g hạnh nhân rang mộc', portion: '1 hộp sữa chua, 12–15 hạt hạnh nhân', kcal: 210, protein: 11, carbs: 14, fat: 12, note: 'Không muối, không đường.' },
        { id: 'sn2', name: '1 quả táo xanh + 1 quả trứng luộc', portion: '150g táo, 1 trứng gà', kcal: 190, protein: 8, carbs: 24, fat: 6, note: 'Giàu chất xơ, ổn định đường huyết trước buổi tập.' },
        { id: 'sn3', name: 'Đậu nành Nhật (Edamame) luộc', portion: '120g đậu nành Nhật nguyên vỏ', kcal: 185, protein: 16, carbs: 15, fat: 7, note: 'Đạm thực vật sạch, ăn nhẹ cực tiện.' },
        { id: 'sn4', name: '1 củ khoai lang nhỏ hấp + sữa đậu nành không đường', portion: '100g khoai lang, 200ml sữa đậu nành', kcal: 215, protein: 10, carbs: 34, fat: 4, note: 'Nạp tinh bột chậm lý tưởng trước khi tập 60 phút.' },
        { id: 'sn5', name: '1 quả chuối vừa + 1 thìa bơ đậu phộng nguyên chất', portion: '100g chuối, 12g bơ đậu phộng không đường', kcal: 205, protein: 6, carbs: 28, fat: 8, note: 'Chọn bơ đậu phộng 100% đậu rang.' },
        { id: 'sn6', name: 'Ức gà xé khô không đường + dưa leo cắt thanh', portion: '50g ức gà luộc/khô, 150g dưa leo', kcal: 175, protein: 26, carbs: 8, fat: 3, note: 'Tối ưu đạm gọn nhẹ.' },
        { id: 'sn7', name: 'Ổi tươi bỏ hạt + hạt óc chó nguyên vị', portion: '150g ổi, 15g hạt óc chó', kcal: 195, protein: 5, carbs: 22, fat: 10, note: 'Giàu vitamin C và chất béo tốt.' },
        { id: 'sn8', name: 'Trứng cút luộc + cà chua bi', portion: '6 trứng cút, 120g cà chua bi', kcal: 180, protein: 13, carbs: 9, fat: 10, note: 'Dễ mang theo đi làm hoặc đi tập.' },
        { id: 'sn9', name: 'Sinh tố rau bina + chuối + sữa hạt không đường', portion: '50g cải bó xôi, 1 chuối nhỏ, 200ml sữa hạt', kcal: 195, protein: 7, carbs: 30, fat: 5, note: 'Xay nguyên chất không thêm đường hay sữa đặc.' }
      ],
      dinner: [
        { id: 'sd1', name: 'Cá diêu hồng hấp hành gừng + Rau cải thìa luộc + 1/2 bát gạo lứt', portion: '150g cá, 180g cải thìa, 80g cơm gạo lứt', kcal: 420, protein: 38, carbs: 36, fat: 12, note: 'Giảm nhẹ tinh bột buổi tối giúp kiểm soát mỡ thừa.' },
        { id: 'sd2', name: 'Salad ức gà áp chảo + Bơ sáp + Rau xà lách & Cà chua bi', portion: '150g ức gà, 50g bơ, 180g rau trộn', kcal: 410, protein: 44, carbs: 18, fat: 17, note: 'Dùng sốt chanh muối tiêu thay vì mayonnaise.' },
        { id: 'sd3', name: 'Tôm hấp nước dừa nhạt + Canh bí xanh nấu gừng + 100g khoai lang', portion: '140g tôm, 1 bát canh bí, 100g khoai hấp', kcal: 395, protein: 36, carbs: 46, fat: 5, note: 'Thanh mát, dễ tiêu hóa trước giờ ngủ.' },
        { id: 'sd4', name: 'Thăn bò xào bông cải bằng nước lọc + 1/2 bát cơm gạo lứt', portion: '130g thăn bò, 180g bông cải, 80g cơm', kcal: 430, protein: 38, carbs: 38, fat: 12, note: 'Xào không dầu bằng chút nước lọc và tỏi thơm.' },
        { id: 'sd5', name: 'Đậu phụ non hấp thịt nạc bằm nấm hương + Rau muống luộc', portion: '150g đậu phụ, 100g nạc heo, 180g rau muống', kcal: 405, protein: 35, carbs: 24, fat: 16, note: 'Nhẹ bụng, giàu đạm và chất xơ.' },
        { id: 'sd6', name: 'Cá ngừ áp chảo tiêu đen + Đậu cô ve luộc + 1/2 củ khoai lang', portion: '150g cá ngừ nạc, 150g đậu cô ve, 100g khoai', kcal: 415, protein: 44, carbs: 38, fat: 8, note: 'Rất giàu protein phục hồi cơ sau ngày tập.' },
        { id: 'sd7', name: 'Mực ống hấp gừng sả + Salad dưa leo cà rốt + 1/2 bát gạo lứt', portion: '150g mực tươi, 150g salad, 80g cơm gạo lứt', kcal: 390, protein: 34, carbs: 40, fat: 8, note: 'Ít béo, chấm nước mắm gừng pha loãng.' },
        { id: 'sd8', name: 'Canh chua cá lóc nấu thanh + 1/2 bát cơm gạo lứt + Rau luộc', portion: '150g cá lóc, rau canh chua, 80g cơm', kcal: 400, protein: 36, carbs: 42, fat: 8, note: 'Không phi tỏi nhiều dầu, hạn chế đường.' },
        { id: 'sd9', name: 'Trứng hấp nấm kim châm + Ức gà luộc xé phay bắp cải', portion: '2 trứng, 110g ức gà, 150g bắp cải trộn', kcal: 410, protein: 44, carbs: 20, fat: 16, note: 'Đơn giản, chế biến nhanh trong 15 phút.' }
      ]
    },
    flexible: {
      breakfast: [
        { id: 'fb1', name: 'Phở gà ta ít bánh (bỏ da) + nhiều hành rau', portion: '1 bát phở vừa, nhiều thịt ức/đùi bỏ da', kcal: 420, protein: 28, carbs: 54, fat: 9, note: 'Hạn chế húp hết nước béo, không ăn kèm quẩy.' },
        { id: 'fb2', name: 'Bánh mì ốp la 2 trứng + dưa leo rau mùi', portion: '1 ổ bánh mì nhỏ, 2 trứng, ít tương ớt', kcal: 430, protein: 20, carbs: 52, fat: 15, note: 'Bỏ qua pate và bơ nhiều dầu để gọn năng lượng.' },
        { id: 'fb3', name: 'Xôi đậu xanh nhỏ + ức gà xé / ruốc thịt vừa phải', portion: '1 gói xôi nhỏ (120g), 60g thịt gà xé', kcal: 440, protein: 24, carbs: 62, fat: 10, note: 'Bỏ bớt mỡ hành, thêm dưa leo ăn kèm cho đỡ ngán.' },
        { id: 'fb4', name: 'Bún mọc / bún thịt nạc dọc mùng', portion: '1 tô vừa, ưu tiên thịt nạc và mọc ít mỡ', kcal: 415, protein: 25, carbs: 56, fat: 10, note: 'Gần gũi, dễ mua hoặc nấu nhanh buổi sáng.' },
        { id: 'fb5', name: 'Cháo thịt bằm trứng bắc thảo / trứng gà + hành tiêu', portion: '1 tô cháo ấm (350ml), 80g thịt bằm, 1 trứng', kcal: 390, protein: 26, carbs: 48, fat: 10, note: 'Ấm bụng, dễ tiêu hóa cho sáng đi làm.' },
        { id: 'fb6', name: 'Bánh cuốn nhân thịt mộc nhĩ + 2 lát chả lụa', portion: '1 đĩa bánh cuốn vừa, 60g chả lụa, giá trụng', kcal: 410, protein: 22, carbs: 58, fat: 9, note: 'Chấm nước mắm pha vừa vị, ăn kèm nhiều rau thơm.' },
        { id: 'fb7', name: 'Cơm tấm sườn nạc (bỏ mỡ bì) + đồ chua dưa leo', portion: '2/3 đĩa cơm, 1 miếng sườn nướng nạc, đồ chua', kcal: 460, protein: 30, carbs: 58, fat: 12, note: 'Không rưới thêm mỡ hành hay tóp mỡ.' },
        { id: 'fb8', name: 'Bún riêu cua đậu phụ + nhiều rau sống', portion: '1 tô vừa, thêm rau muống chẻ và hoa chuối', kcal: 405, protein: 24, carbs: 54, fat: 10, note: 'Bỏ qua giò heo mỡ để nhẹ bụng hơn.' },
        { id: 'fb9', name: 'Sữa tươi ít đường + 1 củ khoai lang nướng + 1 trứng luộc', portion: '220ml sữa, 150g khoai, 1 trứng', kcal: 400, protein: 18, carbs: 60, fat: 9, note: 'Bữa sáng cực nhanh cho ngày bận rộn.' }
      ],
      lunch: [
        { id: 'fl1', name: 'Cơm gia đình: Cá thu sốt cà chua + Rau muống luộc + Canh sấu', portion: '1 bát cơm vừa, 1 khúc cá cỡ lòng bàn tay, 1 đĩa rau', kcal: 560, protein: 34, carbs: 66, fat: 17, note: 'Ăn rau và canh trước khi ăn cơm giúp no nhanh hơn.' },
        { id: 'fl2', name: 'Cơm gia đình: Thịt nạc vai kho tiêu + Canh cải ngọt thịt bằm', portion: '1 bát cơm vừa, 120g thịt kho nạc, 1 bát canh rau', kcal: 570, protein: 36, carbs: 64, fat: 18, note: 'Gạt bớt nước kho mặn, ưu tiên miếng nạc.' },
        { id: 'fl3', name: 'Cơm gia đình: Gà rang gừng bỏ da + Bầu luộc chấm muối vừng', portion: '1 bát cơm vừa, 140g thịt gà, 1 đĩa bầu luộc', kcal: 540, protein: 40, carbs: 64, fat: 13, note: 'Món cơm nhà quen thuộc, đạm cao mà không ngấy.' },
        { id: 'fl4', name: 'Cơm gia đình: Đậu phụ nhồi thịt sốt cà + Rau lang luộc', portion: '1 bát cơm vừa, 2 miếng đậu nhồi, 1 đĩa rau lang', kcal: 550, protein: 30, carbs: 66, fat: 18, note: 'Đậu phụ giúp no lâu, cân bằng đạm động–thực vật.' },
        { id: 'fl5', name: 'Cơm gia đình: Tôm rim mặn ngọt ít dầu + Canh bí đỏ thịt bằm', portion: '1 bát cơm vừa, 130g tôm rim, 1 bát canh bí', kcal: 535, protein: 34, carbs: 68, fat: 13, note: 'Rim lửa vừa ít đường để giữ vị ngọt tự nhiên của tôm.' },
        { id: 'fl6', name: 'Cơm gia đình: Bò xào hành tây cần tỏi + Canh rau ngót', portion: '1 bát cơm vừa, 130g thịt bò xào, 1 bát canh', kcal: 555, protein: 36, carbs: 64, fat: 16, note: 'Xào lửa lớn ít dầu để thịt mềm và rau giữ giòn.' },
        { id: 'fl7', name: 'Bún chả Hà Nội (chọn nạc, nhiều rau sống)', portion: '1 suất bún vừa, thịt nướng nạc, đĩa rau sống đầy', kcal: 565, protein: 32, carbs: 68, fat: 18, note: 'Đổi gió bữa trưa mà vẫn kiểm soát khẩu phần dễ dàng.' },
        { id: 'fl8', name: 'Cơm gia đình: Cá lóc kho tộ ít mỡ + Canh chua rau đay/mồng tơi', portion: '1 bát cơm vừa, 1 khúc cá kho, 1 bát canh cua/rau', kcal: 545, protein: 35, carbs: 66, fat: 15, note: 'Đậm đà đưa cơm nhưng vẫn đủ rau xanh.' },
        { id: 'fl9', name: 'Cơm gia đình: Trứng đúc thịt nạc + Su su cà rốt luộc', portion: '1 bát cơm vừa, 1 phần trứng thịt (2 trứng), rau luộc', kcal: 560, protein: 32, carbs: 64, fat: 19, note: 'Chiên ít dầu trên chảo chống dính, ăn kèm nhiều rau.' }
      ],
      snack: [
        { id: 'fn1', name: 'Sữa chua ít đường + nửa quả xoài / thanh long', portion: '1 hộp sữa chua, 100g trái cây tươi', kcal: 190, protein: 6, carbs: 32, fat: 4, note: 'Mát lành, tốt cho tiêu hóa bữa xế chiều.' },
        { id: 'fn2', name: '1 quả chuối + 1 nắm nhỏ hạt điều rang', portion: '1 quả chuối, 10 hạt điều', kcal: 210, protein: 5, carbs: 29, fat: 9, note: 'Chống đói lúc 4 giờ chiều mà không phải ăn đồ chiên.' },
        { id: 'fn3', name: 'Bắp luộc nửa trái + sữa đậu nành ít đường', portion: '1/2 trái bắp Mỹ/nếp, 200ml sữa đậu nành', kcal: 215, protein: 9, carbs: 35, fat: 4, note: 'Món ăn vặt quốc dân vừa rẻ vừa no lâu.' },
        { id: 'fn4', name: '1 quả táo hoặc 2 múi bưởi lớn', portion: '180–200g trái cây ít ngọt', kcal: 140, protein: 2, carbs: 34, fat: 1, note: 'Tươi mát, giàu vitamin và chất xơ.' },
        { id: 'fn5', name: 'Bánh gạo lứt / bánh quy yến mạch (2–3 miếng) + trà xanh', portion: '30g bánh, 1 cốc trà xanh không đường', kcal: 180, protein: 4, carbs: 30, fat: 5, note: 'Gọn nhẹ tại văn phòng, tránh bánh kem nhiều đường.' },
        { id: 'fn6', name: '1 hũ tàu hũ nóng ít đường gừng', portion: '1 bát nhỏ ít nước đường', kcal: 175, protein: 9, carbs: 24, fat: 5, note: 'Nhắc người bán cho ít nước đường.' },
        { id: 'fn7', name: 'Dưa hấu / ổi chấm muối ớt + 1 hộp sữa tươi ít đường', portion: '150g trái cây, 180ml sữa ít đường', kcal: 205, protein: 7, carbs: 32, fat: 5, note: 'Bổ sung nước và canxi giữa buổi.' },
        { id: 'fn8', name: '2 quả trứng vịt lộn nhỏ hoặc 1 quả trứng gà luộc + cam tươi', portion: '1 trứng gà luộc, 1 quả cam', kcal: 185, protein: 9, carbs: 22, fat: 6, note: 'Đủ năng lượng trước giờ tập chiều.' },
        { id: 'fn9', name: 'Sinh tố bơ ít sữa đặc (hoặc dùng sữa tươi không đường)', portion: '1/3 quả bơ + 150ml sữa tươi ít đường', kcal: 220, protein: 6, carbs: 20, fat: 13, note: 'Chất béo tốt giúp đẹp da và no lâu.' }
      ],
      dinner: [
        { id: 'fd1', name: 'Cơm tối nhẹ: Canh chua cá điêu hồng + Đậu bắp luộc + 2/3 bát cơm', portion: '2/3 bát cơm, 1 khúc cá vừa, nhiều rau canh chua', kcal: 445, protein: 32, carbs: 54, fat: 10, note: 'Giảm nhẹ lượng cơm buổi tối so với bữa trưa.' },
        { id: 'fd2', name: 'Cơm tối nhẹ: Thịt luộc chấm mắm nêm/mắm tỏi + Rau sống dưa leo', portion: '2/3 bát cơm, 120g thịt chân giò nạc, đĩa rau sống', kcal: 455, protein: 30, carbs: 50, fat: 14, note: 'Cuốn rau sống giúp ăn chậm và no lâu hơn.' },
        { id: 'fd3', name: 'Miến gà măng khô (ít miến, nhiều thịt ức & rau thơm)', portion: '1 tô miến vừa, 120g thịt gà bỏ da', kcal: 420, protein: 32, carbs: 52, fat: 9, note: 'Nhẹ bụng cho buổi tối sau ngày làm việc.' },
        { id: 'fd4', name: 'Cơm tối nhẹ: Cá nục kho măng / kho cà + Canh rau mồng tơi', portion: '2/3 bát cơm, 120g cá, 1 bát canh rau', kcal: 450, protein: 32, carbs: 54, fat: 11, note: 'Món ăn bình dân giàu đạm biển và chất xơ.' },
        { id: 'fd5', name: 'Gỏi cuốn tôm thịt (4 cuốn) chấm nước mắm chua ngọt', portion: '4 cuốn đầy rau bún tôm thịt nạc', kcal: 410, protein: 28, carbs: 54, fat: 8, note: 'Thay tương đậu phộng nhiều dầu bằng nước mắm chua ngọt.' },
        { id: 'fd6', name: 'Cơm tối nhẹ: Mực xào cần tỏi hành tây + Canh bí đao nấu tôm', portion: '2/3 bát cơm, 130g mực xào, 1 bát canh bí', kcal: 435, protein: 34, carbs: 52, fat: 9, note: 'Ít chất béo, giàu khoáng chất.' },
        { id: 'fd7', name: 'Cơm tối nhẹ: Trứng hấp thịt nấm + Cải ngọt luộc chấm xì dầu', portion: '2/3 bát cơm, 1 bát trứng hấp thịt, 1 đĩa rau luộc', kcal: 445, protein: 30, carbs: 50, fat: 13, note: 'Không cần chiên dầu, mềm ngon dễ ăn.' },
        { id: 'fd8', name: 'Cơm tối nhẹ: Ức gà xào nấm đông cô + Canh rau dền', portion: '2/3 bát cơm, 130g ức gà, 1 bát canh rau', kcal: 435, protein: 38, carbs: 52, fat: 8, note: 'Nấu nhanh gọn cho bữa tối gia đình.' },
        { id: 'fd9', name: 'Canh khổ qua nhồi thịt nạc + 2/3 bát cơm + Dưa leo trộn', portion: '2/3 bát cơm, 2 khoanh khổ qua thịt, dưa leo', kcal: 430, protein: 28, carbs: 52, fat: 12, note: 'Thanh nhiệt, dễ ngủ.' }
      ]
    }
  };

  return {
    DAY_NAMES,
    ACTIVITY_LEVELS,
    EXERCISES,
    REST_DAY_TIPS,
    WORKOUT_TEMPLATES,
    MEAL_POOLS
  };
}));
