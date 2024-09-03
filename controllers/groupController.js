const db = require('../models/index.js');
const { Group, GroupBadge, Badge, Post } = db;
const { hashPassword, comparePassword } = require('../utils/passwordUtils.js');
const { Op, literal } = require('sequelize');
const { checkGroupLikeCount } = require('../services/badgeService.js');
const { NotFoundError, WrongPasswordError, BadRequestError } = require('../utils/customErrors');

const getGroupById = async (groupId) => {
  try {
    const group = await Group.findByPk(groupId, {
      attributes: ['id', 'name', 'imageUrl', 'isPublic', 'likeCount', 'createdAt', 'introduction'],
    });

    if (!group) {
      throw new NotFoundError();
    }

    const groupData = group.toJSON();
    groupData.badges = await getBadgesById(groupId);
    groupData.postCount = await getPostCountById(groupId);

    return groupData;
  } catch (error) {
    throw error;
  }
};

const getBadgesById = async (groupId) => {
  try {
    const badges = await GroupBadge.findAll({
      where: { groupId },
      include: {
        model: Badge,
        attributes: ['name']
      },
      attributes: []
    });
  
    const badgeNames = badges.map(groupBadge => groupBadge.Badge.name);
    return badgeNames;
  } catch (error) {
    throw error;
  }
};

const getPostCountById = async (groupId) => {
  try {
    const postCount = await Post.count({
      where: { groupId }
    });
    return postCount;
  } catch (error) {
    throw error;
  }
}

exports.createGroup = async (req, res, next) => {
  const { name, password, imageUrl, isPublic, introduction } = req.body;
  try {
    const hashedPassword = await hashPassword(password);
    const group = await Group.create({
      name,
      password: hashedPassword,
      imageUrl,
      isPublic,
      introduction
    });
    const groupWithDetails = await getGroupById(group.id);
    res.status(201).send(groupWithDetails);
  } catch(err) {
    next(err);
  }
};

exports.getGroups = async (req, res, next) => {
  const { 
    page = 1, 
    pageSize = 10, 
    sortBy = 'latest', 
    keyword = '', 
    isPublic = true
  } = req.query;

  try {
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const sortOptions = {
      latest: [['createdAt', 'DESC']],
      mostPosted: [['postCount', 'DESC']],
      mostLiked: [['likeCount', 'DESC']],
      mostBadge: [['badgeCount', 'DESC']]
    };

    const { count: totalItemCount, rows: data } = await Group.findAndCountAll({
      where: {
        isPublic,
        name: {
          [Op.like]: `%${keyword}%`
        }
      },
      order: sortOptions[sortBy],
      offset,
      limit,
      attributes: [
        'id',
        'name',
        'imageUrl',
        'isPublic',
        'likeCount',
        'createdAt',
        'introduction',
        [
          literal(`(
            SELECT COUNT(*)
            FROM GroupBadges AS groupBadge
            WHERE groupBadge.groupId = Group.id
          )`),
          'badgeCount'
        ],
        [
          literal(`(
            SELECT COUNT(*)
            FROM Posts AS post
            WHERE post.groupId = Group.id
          )`),
          'postCount'
        ]
      ],
      subQuery: false
    });

    const currentPage = parseInt(page);
    const totalPages = Math.ceil(totalItemCount/limit);

    const response = {
      currentPage,
      totalPages,
      totalItemCount,
      data
    };

    res.send(response);
  } catch (err) {
    next(err);
  }
};

exports.updateGroup = async (req, res, next) => {
  const { groupId } = req.params;
  const { name, password, imageUrl, isPublic, introduction } = req.body;
  try {
    const group = await Group.findByPk(groupId);
    if (!group) {
      throw new NotFoundError();
    }

    const isMatch = await comparePassword(password, group.password);

    if (!isMatch) {
      throw new WrongPasswordError();
    }

    group.name = name;
    group.imageUrl = imageUrl;
    group.isPublic = isPublic;
    group.introduction = introduction;
    await group.save();

    const groupWithDetails = await getGroupById(groupId);
    res.status(200).send(groupWithDetails);
  } catch (err) {
    next(err);
  }
};

exports.deleteGroup = async (req, res, next) => {
  const { groupId } = req.params;
  const { password } = req.body;
  try {
    const group = await Group.findByPk(groupId);
    if (!group) {
      throw new NotFoundError();
    }

    const isMatch = await comparePassword(password, group.password);
    if (!isMatch) {
      throw new WrongPasswordError();
    }

    await group.destroy();
    res.status(204).send({ message: "그룹 삭제 성공" });
  } catch (err) {
    next(err);
  }
};

exports.getGroup = async (req, res, next) => {
  const { groupId } = req.params;
  try {
    const group = await getGroupById(groupId);
    res.status(200).send(group);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.verifyGroupPassword = async (req, res, next) => {
  const { groupId } = req.params;
  const { password } = req.body;
  try {
    if (!password) {
      throw new BadRequestError();
    }

    const group = await Group.findByPk(groupId);
    if (!group) {
      throw new NotFoundError();
    }

    const isMatch = await comparePassword(password, group.password);
    if (!isMatch) {
      throw new WrongPasswordError();
    }
    res.status(200).send({ message: "비밀번호가 확인되었습니다" });
  } catch (err) {
    next(err)
  }
};

exports.likeGroup = async (req, res, next) => {
  const { groupId } = req.params;
  try {
    const group = await Group.findByPk(groupId);
    if (!group) {
      throw new NotFoundError();
    }

    group.likeCount++;
    await group.save();
    await checkGroupLikeCount(groupId); // 배지 조건 확인
    res.status(200).send({ message: "그룹 공감하기 성공" });
  } catch (err) {
    next(err);
  }
};

exports.isGroupPublic = async (req, res, next) => {
  const { groupId } = req.params;
  
  try {
    const group = await Group.findByPk(groupId, {
      attributes: ['id', 'isPublic']
    });
    if (!group) {
      throw new BadRequestError();
    }
    res.status(200).send(group);
  } catch (err) {
    next(err);
  }
};