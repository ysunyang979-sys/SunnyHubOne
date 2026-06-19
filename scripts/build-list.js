const fs = require('fs');
const path = require('path');

const mangaDir = path.join(__dirname, '../manga');
const outputFile = path.join(__dirname, '../data.json');

function build() {
    console.log('--- 🔍 开始全能扫描 (嵌套系列模式) ---');
    if (!fs.existsSync(mangaDir)) {
        console.error('❌ 错误：找不到 manga 文件夹！');
        return;
    }

    const seriesFolders = fs.readdirSync(mangaDir);
    const output = [];

    seriesFolders.forEach(seriesName => {
        const seriesPath = path.join(mangaDir, seriesName);
        const stats = fs.statSync(seriesPath);

        if (!stats.isDirectory()) return;

        // Extract tag from [Tag]
        let tag = seriesName;
        let cleanTitle = seriesName;
        const match = seriesName.match(/^\[(.*?)\]/);
        if (match) {
            tag = match[1];
            cleanTitle = seriesName.substring(match[0].length).trim();
        }

        const chapters = [];
        let firstCover = null;

        const chapterFolders = fs.readdirSync(seriesPath);
        chapterFolders.forEach(chapName => {
            const chapPath = path.join(seriesPath, chapName);
            if (!fs.statSync(chapPath).isDirectory()) return;

            const files = fs.readdirSync(chapPath)
                .filter(f => /\.(webp|jpg|png|jpeg|gif)$/i.test(f))
                .sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}));

            if (files.length > 0) {
                const imgs = files.map(f => `manga/${seriesName}/${chapName}/${f}`.replace(/\\/g, '/'));
                if (!firstCover) firstCover = imgs[0];
                
                // Try to make a clean chapter title from the folder name
                let chapTitle = chapName.replace(cleanTitle, '').replace(match ? match[0] : '', '').trim();
                chapTitle = chapTitle.replace(/^[-_ ]+/, '').trim(); // Remove leading dashes
                if (!chapTitle) chapTitle = "全一话 / 单本";

                chapters.push({
                    title: chapTitle,
                    originalFolderName: chapName,
                    images: imgs
                });
            }
        });

        if (chapters.length > 0) {
            output.push({
                title: cleanTitle,
                tag: tag,
                cover: firstCover,
                chapters: chapters
            });
            console.log(`✅ 已添加系列: [${tag}] ${cleanTitle} (${chapters.length}个章节)`);
        } else {
            console.log(`⚠️ 跳过系列: ${seriesName} (没找到包含图片的章节)`);
        }
    });

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n✨ 完成！总共写入 ${output.length} 个系列到 data.json`);
}

build();
