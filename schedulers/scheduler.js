const cron = require('node-cron');
const { checkGroupAge } = require('../services/badgeService.js');
const { Group } = require('../models/index.js');

cron.schedule('0 0 * * *', async () => {
  try {
    const groups = await Group.findAll();
    await Promise.all(groups.map(group => checkGroupAge(group.id)));
  } catch (error) {
    console.error('배지 부여 실패: ', error);
  }
});

console.log('Scheduler is running');