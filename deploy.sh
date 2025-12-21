#!/bin/bash
# Author: zendu 
# Last Modified by:   zendu 
# Last Modified time: 2023-12-15 15:18:54 
# 增加了修改MD文件的img路径，上传到服务器的images文件夹


# cd /Users/zendu/Downloads/ymBlog
# rm .*un~ &> /dev/null
# gsed -i 's#](img/#](https://ymlog.cn/images/#' source/_posts/*.md
# gsed -i 's#src="img/#src="https://ymlog.cn/images/#' source/_posts/*.md
# hexo g   
# cp -r source/_posts/img/* public/images/
# rsync -av --delete public root@tencent.cloud:/usr/share/nginx/
# gsed -i 's#](https://ymlog.cn/images/#](img/#' source/_posts/*.md

# git config --global core.autocrlf true

# https://ymlog.cn/images -> /img/

found_exception=false


# git config --global http.proxy http://localhost:7890
# git config --global https.proxy http://localhost:7890


# 遍历 source/_posts 目录下的所有 .md 文件
for file in source/_posts/*.md; do
    # 使用 grep 检查文件内容是否包含特定字符串，并获取行号
    if grep -n "/_posts/img" "$file"; then
        # 打印出现异常的文件名和行号
        echo -e "\e[41m\e[97m在文件 $file 发现图片路径异常\e[0m"
        found_exception=true
    fi
done

# 如果发现了异常，退出脚本
if [ "$found_exception" = true ]; then
    exit 1
else
    echo "---Image Checkout----"
fi

# hexo clean

cp -r source/_posts/img source/

# 检查 Read.md 是否有修改，如果有则更新 update 时间
if git status --porcelain | grep -q "source/_posts/Read.md"; then
    current_time=$(date +'%Y-%m-%d %H:%M:%S')
    sed -i '' "s/^update: .*/update: $current_time/" source/_posts/Read.md
    echo "已更新 Read.md 的 update 时间为: $current_time"
fi

git add .
current_date=$(date +'%Y-%m-%d %H:%M')
if [ "$#" -gt 0 ]; then
    commit_message="[$current_date] $1"
else
    commit_message="[$current_date]"
fi
git commit -m "$commit_message"
git push 



git config --global --unset http.proxy;
git config --global --unset https.proxy;


echo -e "\n [ Deploy Finish ] \n"


