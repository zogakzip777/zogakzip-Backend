const cron = require('node-cron');
const { checkGroupAge, awardBadge } = require('../services/badgeService.js');
const { Group } = require('../models/index.js');

cron.schedule('0 0 * * *', async () => {
  try {
    const groups = await Group.findAll();
    for (const group of groups) {
      if (await checkGroupAge(group.id)) {
        await awardBadge(group.id, 3);
      }
    }
  } catch (error) {
    console.error("배지 부여 실패");
  }
});

console.log('Scheduler is running');