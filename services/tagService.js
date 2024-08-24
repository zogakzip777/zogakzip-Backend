const db = require('../models/index.js');
const { PostTag, Tag } = db;

const createTags = async (tags, postId) => {
  try {
    for (const tagName of tags) {
      const [tag, created] = await Tag.findOrCreate({ where: { name: tagName }});
      await PostTag.findOrCreate({ 
        where: { tagId: tag.id, postId } 
      });
    }    
  } catch (error) {
    throw error;
  }
};

const updateTags = async (newTags, postId) => {
  try {
    const oldTags = await Tag.findAll({
      include: {
        model: PostTag,
        where: { postId }
      }
    });
    const oldTagNames = oldTags.map(tag => tag.name);

    // 새로 추가할 태그
    const tagsToCreate = newTags.filter(newTag => !oldTagNames.includes(newTag));
    await createTags(tagsToCreate, postId);

    // 제거할 태그
    const tagsToRemove = oldTags.filter(oldTag => !newTags.includes(oldTag.name));
    await Promise.all(
      tagsToRemove.map(async (tag) => {
        await PostTag.destroy({
          where: { 
            postId,
            tagId: tag.id 
          }
        });
      })
    );
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createTags,
  updateTags
};