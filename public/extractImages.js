const fs = require('fs');
const path = require('path');

const postsDir = '_posts/';
const imgDir = 'img/';
const destDir = 'dest/';

// 创建 dest 目录（如果它不存在）
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
}

// 检查目录是否存在
if (!fs.existsSync(postsDir)) {
    console.error(`Directory ${postsDir} does not exist.`);
    process.exit(1);
}

// 读取目录中的所有文件
fs.readdir(postsDir, (err, files) => {
    if (err) {
        console.error(`Error reading files from ${postsDir}: ${err.message}`);
        process.exit(1);
    }

    files.forEach(file => {
        if (path.extname(file) === '.md') {
            const filePath = path.join(postsDir, file);

            // 读取文件内容
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading file ${file}: ${err.message}`);
                    return;
                }

                // 使用正则表达式匹配图片链接
                const markdownImageRegex = /!\[[^\]]*\]\((\/img\/)?([^)]+)\)/g;
                const htmlImageRegex = /<img src="\/img\/([^"]+)"/g;
                let match;

                // 匹配并复制 Markdown 格式的图片
                while ((match = markdownImageRegex.exec(data)) !== null) {
                    const imageName = match[2];
                    const srcPath = path.join(imgDir, imageName);
                    const destPath = path.join(destDir, imageName);

                    copyImage(srcPath, destPath);
                }

                // 匹配并复制 HTML 格式的图片
                while ((match = htmlImageRegex.exec(data)) !== null) {
                    const imageName = match[1];
                    const srcPath = path.join(imgDir, imageName);
                    const destPath = path.join(destDir, imageName);

                    copyImage(srcPath, destPath);
                }
            });
        }
    });
});

function copyImage(srcPath, destPath) {
    fs.copyFile(srcPath, destPath, (err) => {
        if (err) {
            console.error(`Error copying file ${srcPath} to ${destPath}: ${err.message}`);
        } else {
            console.log(`Copied ${srcPath} to ${destPath}`);
        }
    });
}
