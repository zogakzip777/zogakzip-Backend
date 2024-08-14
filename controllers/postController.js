const db = require('../models/index.js');
const { Post, Comment, Group } = db; 
const { comparePassword, hashPassword } = require('../utils/passwordUtils'); // 비밀번호 유틸리티 불러오기
const { Op } = require('sequelize'); 

// 게시글 등록 
exports.createPost = async (req, res) => {
    const { groupId } = req.params;
    const {
        nickname,
        title,
        content,
        postPassword,
        groupPassword,
        imageUrl,
        tags,
        location,
        moment,
        isPublic
    } = req.body;

    try {
        // 필수 필드 확인
        if (!nickname || !title || !content || !postPassword || !groupPassword) {
            return res.status(400).json({ message: '잘못된 요청입니다' });
        }

        // 그룹 확인 및 비밀번호 검증
        const group = await Group.findByPk(groupId);

        if (!group) {
            return res.status(404).json({ message: '존재하지 않는 그룹입니다' });
        }

        const isGroupPasswordMatch = await comparePassword(groupPassword, group.password);
        if (!isGroupPasswordMatch) {
            return res.status(403).json({ message: '그룹 비밀번호가 틀렸습니다' });
        }

        // 게시글 비밀번호 해싱
        const hashedPostPassword = await hashPassword(postPassword);

        // 게시글 생성 및 저장
        const post = await Post.create({
            groupId,
            nickname,
            title,
            content,
            password: hashedPostPassword, // 해싱된 비밀번호 저장
            imageUrl,
            tags,
            location,
            moment,
            isPublic,
            likeCount: 0,
            commentCount: 0
        });

        // 성공 응답 반환
        return res.status(200).json({
            id: post.id,
            groupId: post.groupId,
            nickname: post.nickname,
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl,
            tags: post.tags,
            location: post.location,
            moment: post.moment,
            isPublic: post.isPublic,
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            createdAt: post.createdAt
        });
    } catch (error) {
        console.error(`게시글 등록 중 오류 발생: ${error.message}`);
        return res.status(400).json({ message: '잘못된 요청입니다' });
    }
};


// 게시글 목록 조회 
exports.getPosts = async (req, res) => {
    const { groupId } = req.params;
    const { page = 1, pageSize = 10, sortBy = 'latest', keyword = '', isPublic } = req.query;

    try {
        // 페이지네이션 설정
        const limit = parseInt(pageSize, 10);
        const offset = (parseInt(page, 10) - 1) * limit;

        // 기본 WHERE 절
        const whereClause = {
            groupId,
            ...(isPublic !== undefined && { isPublic: isPublic === 'true' }),
            ...(keyword && {
                [Op.or]: [
                    { title: { [Op.like]: `%${keyword}%` } },
                    { tags: { [Op.like]: `%${keyword}%` } },
                ]
            })
        };

        // 정렬 옵션 설정
        let orderClause = [['createdAt', 'DESC']]; // 기본값: 최신순
        if (sortBy === 'mostCommented') {
            orderClause = [['commentCount', 'DESC']];
        } else if (sortBy === 'mostLiked') {
            orderClause = [['likeCount', 'DESC']];
        }

        // 데이터베이스에서 게시글 목록 조회
        const { count, rows } = await Post.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: orderClause,
            attributes: [
                'id',
                'nickname',
                'title',
                'imageUrl',
                'tags',
                'location',
                'moment',
                'isPublic',
                'likeCount',
                'commentCount',
                'createdAt'
            ]
        });

        // 총 페이지 수 계산
        const totalPages = Math.ceil(count / limit);

        // 응답 반환
        return res.status(200).json({
            currentPage: parseInt(page, 10),
            totalPages,
            totalItemCount: count,
            data: rows
        });
    } catch (error) {
        console.error(`게시글 목록 조회 중 오류 발생: ${error.message}`);
        return res.status(400).json({ message: '잘못된 요청입니다' });
    }
};


// 게시글 수정 
exports.updatePost = async (req, res) => {
    const { postId } = req.params;
    const { nickname, title, content, postPassword, imageUrl, tags, location, moment, isPublic } = req.body;

    try {
        // 데이터베이스에서 해당 게시글 찾기
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).json({ message: '존재하지 않습니다' });
        }

        // 비밀번호 확인
        const isMatch = await comparePassword(postPassword, post.password);
        if (!isMatch) {
            return res.status(403).json({ message: '비밀번호가 틀렸습니다' });
        }

        // 게시글 내용 수정
        if (nickname) post.nickname = nickname;
        if (title) post.title = title;
        if (content) post.content = content;
        if (imageUrl) post.imageUrl = imageUrl;
        if (tags) post.tags = tags;
        if (location) post.location = location;
        if (moment) post.moment = moment;
        if (typeof isPublic === 'boolean') post.isPublic = isPublic;

        // 변경된 게시글 저장
        await post.save();

        // 수정된 게시글의 응답 반환
        return res.status(200).json({
            id: post.id,
            groupId: post.groupId,
            nickname: post.nickname,
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl,
            tags: post.tags,
            location: post.location,
            moment: post.moment,
            isPublic: post.isPublic,
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            createdAt: post.createdAt
        });
    } catch (error) {
        console.error(`게시글 수정 중 오류 발생: ${error.message}`);
        return res.status(400).json({ message: '잘못된 요청입니다' });
    }
};


// 게시글 삭제 
exports.deletePost = async (req, res) => {
    const { postId } = req.params;
    const { postPassword } = req.body;

    try {
        // 데이터베이스에서 해당 게시글 찾기
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).json({ message: '존재하지 않습니다' });
        }

        // 비밀번호 확인
        const isMatch = await comparePassword(postPassword, post.password);
        if (!isMatch) {
            return res.status(403).json({ message: '비밀번호가 틀렸습니다' });
        }

        // 게시글 삭제
        await post.destroy();

        return res.status(200).json({ message: '게시글 삭제 성공' });
    } catch (error) {
        console.error(`게시글 삭제 중 오류 발생: ${error.message}`);
        return res.status(400).json({ message: '잘못된 요청입니다' });
    }
};


// 게시글 상세 조회 
exports.getPostById = async (req, res) => {
    const { postId } = req.params;

    try {
        // 게시글과 관련된 댓글 수, 공감 수 포함하여 조회
        const post = await Post.findOne({
            where: { id: postId },
            attributes: [
                'id',
                'groupId',
                'nickname',
                'title',
                'content',
                'imageUrl',
                'tags',
                'location',
                'moment',
                'isPublic',
                'likeCount',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('comments.id')), 'commentCount'], // 댓글 수 계산
                'createdAt'
            ],
            include: [
                {
                    model: Comment,
                    as: 'comments',
                    attributes: [] // 댓글 수만 필요하므로 댓글 데이터를 가져오지 않음
                },
            ],
            group: ['Post.id'] // 댓글 수를 정확하게 세기 위해 그룹화
        });

        if (!post) {
            return res.status(404).json({ message: '존재하지 않습니다' });
        }

        return res.status(200).json({
            id: post.id,
            groupId: post.groupId,
            nickname: post.nickname,
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl,
            tags: post.tags,
            location: post.location,
            moment: post.moment,
            isPublic: post.isPublic,
            likeCount: post.likeCount,
            commentCount: post.dataValues.commentCount, // 별칭으로 조회된 값을 반환
            createdAt: post.createdAt
        });
    } catch (error) {
        console.error(`게시글 상세 조회 중 오류 발생: ${error.message}`);
        return res.status(400).json({ message: '잘못된 요청입니다' });
    }
};


// 게시글 조회 권한 확인 
exports.verifyPostPassword = async (req, res) => {
    const { postId } = req.params;
    const { password } = req.body;

    try {
        // 데이터베이스에서 해당 게시글 찾기
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).json({ message: '존재하지 않습니다' });
        }

        // 비밀번호 확인
        const isMatch = await comparePassword(password, post.password);
        if (!isMatch) {
            return res.status(401).json({ message: '비밀번호가 틀렸습니다' });
        }

        // 비밀번호가 일치할 경우 성공 메시지 반환
        return res.status(200).json({ message: '비밀번호가 확인되었습니다' });
    } catch (error) {
        console.error(`게시글 조회 권한 확인 중 오류 발생: ${error.message}`);
        return res.status(400).json({ message: '잘못된 요청입니다' });
    }
};


// 게시글 공감하기 
exports.likePost = async (req, res) => {
    const { postId } = req.params;

    try {
        // 데이터베이스에서 해당 게시글 찾기
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).json({ message: '존재하지 않습니다' });
        }

        // 공감 수 증가
        post.likeCount += 1;

        // 변경된 게시글 저장
        await post.save();

        return res.status(200).json({ message: '게시글 공감하기 성공' });
    } catch (error) {
        console.error(`게시글 공감 처리 중 오류 발생: ${error.message}`);
        return res.status(500).json({ message: '서버 오류로 인해 공감하기를 처리할 수 없습니다.', error: error.message });
    }
};

// 게시글 공개 여부 확인 
exports.isPostPublic = async (req, res) => {
    const { postId } = req.params;

    try {
        // 데이터베이스에서 해당 게시글 찾기
        const post = await Post.findByPk(postId, {
            attributes: ['id', 'isPublic'] // 필요한 필드만 선택
        });

        if (!post) {
            return res.status(404).json({ message: '존재하지 않습니다' });
        }

        // 공개 여부 반환
        return res.status(200).json({
            id: post.id,
            isPublic: post.isPublic
        });
    } catch (error) {
        console.error(`게시글 공개 여부 확인 중 오류 발생: ${error.message}`);
        return res.status(500).json({ message: '서버 오류로 인해 요청을 처리할 수 없습니다.', error: error.message });
    }
};


