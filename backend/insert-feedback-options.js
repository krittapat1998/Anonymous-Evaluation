const pool = require('./src/config/database');
const { v4: uuidv4 } = require('uuid');

const feedbackData = {
  strengths: [
    'รับผิดชอบต่องานสูง',
    'ทำงานตรงเวลา',
    'ทำงานรอบคอบและละเอียด',
    'เรียนรู้เร็ว ปรับตัวได้ดี',
    'แก้ปัญหาเฉพาะหน้าได้ดี',
    'มีความคิดสร้างสรรค์',
    'สื่อสารได้ชัดเจน',
    'ประสานงานกับผู้อื่นได้ดี',
    'ทำงานเป็นทีมได้ดี',
    'มีภาวะผู้นำ',
    'ใจเย็นและรับฟังผู้อื่น',
    'มีความอดทนต่อแรงกดดัน',
    'ตั้งใจทำงานและมุ่งมั่น',
    'ใส่ใจคุณภาพของงาน',
    'มีวินัยในการทำงาน',
    'กล้าตัดสินใจ',
    'มีความรับผิดชอบต่อทีม',
    'มีทัศนคติเชิงบวก',
    'พร้อมเรียนรู้สิ่งใหม่',
    'มีความซื่อสัตย์และน่าเชื่อถือ',
  ],
  weaknesses: [
    'บริหารเวลาได้ไม่ดี',
    'ตัดสินใจช้า',
    'ขาดความมั่นใจในการแสดงความคิดเห็น',
    'วางแผนงานไม่ชัดเจน',
    'ทำงานล่าช้า',
    'งานขาดความละเอียด',
    'สื่อสารไม่ชัดเจน',
    'ไม่กล้าตัดสินใจ',
    'รับฟังความคิดเห็นผู้อื่นน้อย',
    'ทำงานคนเดียวมากเกินไป',
    'ปรับตัวกับการเปลี่ยนแปลงช้า',
    'ขาดความกระตือรือร้น',
    'จัดลำดับความสำคัญไม่ดี',
    'ขาดความรอบคอบ',
    'ควบคุมอารมณ์ได้ไม่ดี',
    'ไม่กล้าแสดงออก',
    'พึ่งพาผู้อื่นมากเกินไป',
    'ไม่ค่อยรับผิดชอบงานบางส่วน',
    'ขาดแรงจูงใจในการทำงาน',
    'ไม่เปิดรับความคิดเห็นใหม่',
  ],
};

async function insertFeedbackOptions() {
  try {
    // Get all surveys
    const surveysResult = await pool.query('SELECT id FROM surveys');
    
    if (surveysResult.rows.length === 0) {
      console.log('No surveys found');
      process.exit(1);
    }

    const surveyId = surveysResult.rows[0].id;
    console.log(`Inserting feedback options for survey: ${surveyId}`);

    // Insert strengths
    let displayOrder = 0;
    for (const strength of feedbackData.strengths) {
      await pool.query(
        `INSERT INTO feedback_options (id, survey_id, type, option_text, display_order, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [uuidv4(), surveyId, 'strength', strength, displayOrder]
      );
      displayOrder++;
    }

    // Insert weaknesses
    displayOrder = 0;
    for (const weakness of feedbackData.weaknesses) {
      await pool.query(
        `INSERT INTO feedback_options (id, survey_id, type, option_text, display_order, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [uuidv4(), surveyId, 'weakness', weakness, displayOrder]
      );
      displayOrder++;
    }

    console.log('✓ All feedback options inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error inserting feedback options:', error);
    process.exit(1);
  }
}

insertFeedbackOptions();
