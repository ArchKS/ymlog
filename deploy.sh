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

# 检查 source/_posts/ 目录下所有修改的 .md 文件，并更新它们的 update 时间
current_time=$(date +'%Y-%m-%d %H:%M:%S')
modified_files=$(git status --porcelain | grep "^ M\|^M " | grep "source/_posts/.*\.md$" | awk '{print $2}')

# if [ -n "$modified_files" ]; then
#     echo "检测到以下 Markdown 文件被修改："
#     echo "$modified_files"
#     echo ""

#     while IFS= read -r file; do
#         if [ -f "$file" ]; then
#             # 检查文件是否包含 update 字段
#             if grep -q "^update:" "$file"; then
#                 # Windows Git Bash 环境使用 sed -i (不需要空字符串参数)
#                 sed -i "s/^update: .*/update: $current_time/" "$file"
#                 echo "✓ 已更新 $file 的 update 时间为: $current_time"
#             else
#                 echo "⚠ $file 中未找到 update 字段，跳过"
#             fi
#         fi
#     done <<< "$modified_files"
#     echo ""
# else
#     echo "未检测到 source/_posts/ 目录下有修改的 Markdown 文件"
# fi

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


