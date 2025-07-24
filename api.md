# aaPanel Linux Panel API Documentation

# Foreword

Through the aaPanel API, you can fully control all the functions of the aaPanel Linux panel. In fact, all the functions used after the user logs in to the panel are also docked through the same interface, which means that if you are familiar with the browser debugger, you can easily Complete a third-party front-end docking against the operational parameters of the aaPanel Linux panel.

# Signature algorithm

api_sk $\mathbf { \tau } = \mathbf { \tau }$ Interface key (obtained in the panel settings page - API interface) request_time $\mathbf { \tau } = \mathbf { \tau }$ Uinx timestamp of current request time ( php: time() / python: time.time() ) request_token $\mathbf { \tau } = \mathbf { \tau }$ md5(string(request_time) $^ +$ md5(api_sk)) PHP Example： \$request_token $\mathbf { \tau } = \mathbf { \tau }$ md5(\$request_time . ‘’ . md5(\$api_sk))

signature：  

<html><body><table><tr><td> Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>request_time</td><td></td><td>Currentuinx timestamp[Must]</td></tr><tr><td>request_token</td><td></td><td>md5(string(request_time)+md5(api_sk))[Must]</td></tr><tr><td>Other parameters</td><td></td><td>Other parameters required by the functional interface [Optional]</td></tr></table></body></html>

# Precautions：

1. Please use the POST method to request the API interface.   
2. In order to ensure the efficiency of the request, please save the cookie and attach a cookie on each request.   
3. For panel security considerations, be sure to add an IP whitelist   
4. All response content is unified into Json data format

# DEMO download

PHP-Demo: https://www.bt.cn/api_demo_php.zip

# System status related interface

Get system basic statistics

URI address：/system?action $\mid =$ GetSystemTotal

Incoming parameters：No

Response：

<html><body><table><tr><td>Field</td><td>Field value example</td><td>Description</td></tr><tr><td>system</td><td>CentOS Linux 7.5.1804 (Core)</td><td>Operating system information</td></tr><tr><td>version</td><td>6.8.2</td><td>Panel version</td></tr><tr><td>time</td><td>0天23小时45分钟</td><td>The time since the last boot to the present</td></tr><tr><td>cpuNum</td><td>2</td><td>CPU core number</td></tr><tr><td>cpuRealUsed</td><td>2.01</td><td>CPU usage (percentage)</td></tr><tr><td>memTotal</td><td>1024</td><td>Physical memory capacity (MB)</td></tr><tr><td>memRealUsed</td><td>300</td><td>Used physical memory (MB)</td></tr><tr><td>memFree</td><td>724</td><td>Available physical memory (MB)</td></tr><tr><td>memCached</td><td>700</td><td>Cached memory (MB)</td></tr><tr><td>memBuffers</td><td>100</td><td>System buffer (MB)</td></tr></table></body></html>

# Response content example：

"cpuRealUsed": 0.85,   
"memTotal": 1741,   
"system": "CentOS Linux 7.5.1804 (Core)",   
"memRealUsed": 691,   
"cpuNum": 6,   
"memFree": 189,   
"version": "6.8.1",   
"time": "0\u592923\u5c0f\u65f657\u5206\u949f",   
"memCached": 722,   
"memBuffers": 139,   
"isuser": 0

# Get disk partition information

URI address：/system?action $\mid =$ GetDiskInfo

Incoming parameters：No

Response：

<html><body><table><tr><td>Field</td><td>Field value example</td><td>Description</td></tr><tr><td>[].path</td><td>/</td><td>Partition mount point</td></tr><tr><td>[].inodes</td><td>["8675328","148216","8527112", "2%"]</td><td>Partition Inode Usage Information [Total, Used，Available, Usage]</td></tr><tr><td>[].size</td><td>["8.3G","4.0G", "4.3G", "49%"]</td><td>Partition capacity usage information [total, used,available, usage]</td></tr></table></body></html>

# Response content example：

[ {"path": "/", "inodes": ["8675328", "148216", "8527112", "2%"], "size": ["8.3G", "4.0G", "4.3G", "49%"]

},   
{ "path": "/www", "inodes": ["655360", "295093", "360267", "46%"], "size": ["9.8G", "3.7G", "5.6G", "40%"]   
}

# Get real-time status information (CPU, memory, network, load)

URI address：/system?action $\mid =$ GetNetWork

Incoming parameters：NoResponse：

<html><body><table><tr><td>Field</td><td>Field value example</td><td>Description</td></tr><tr><td>downTotal</td><td>446326699</td><td>Total reception (number of bytes)</td></tr><tr><td>upTotal</td><td>77630707</td><td>Total transmission (number of bytes)</td></tr><tr><td>downPackets</td><td>1519428</td><td>Total collection (a)</td></tr><tr><td>upPackets</td><td>175326</td><td>Total delivery (a)</td></tr><tr><td>down</td><td>36.22</td><td>Downstream traffic (KB)</td></tr><tr><td>up</td><td>72.81</td><td>Upstream traffic (KB)</td></tr><tr><td>cpu</td><td>[1.87, 6]</td><td>CPU real-time information [usage rate, core number]</td></tr><tr><td>mem</td><td>{memFree:189,memTotal: 1741,memCached: 722,memBuffers:139,memRealUsed: 691}</td><td>Memory real-time information</td></tr><tr><td>load</td><td>{max: 12, safe: 9,one:0, five: 0.01, limit: 12, fifteen: 0.05}</td><td>Load real-time information one: 1 minute five:5 minutes fifteen:10 minutes</td></tr></table></body></html>

Response content example：   
{ "load": {"max": 12, "safe": 9.0, "one": 0.01, "five": 0.02, "limit": 12, "fifteen": 0.05}, "down": 8.77, "downTotal": 453078627, "mem": {"memFree": 189, "memTotal": 1741, "memCached": 722, "memBuffers": 140, "memRealUsed": 690}, "up": 4.33, "upTotal": 78070942, "upPackets": 177930, "downPackets": 1548192, "cpu": [0.23, 6]   
}

# Check for installation tasks

URI address：/ajax?action=GetTaskCount   
传入参数：无   
Incoming parameters：No   
Response：0

# Check panel update

# URI address：/ajax?action $\mathbf { \tau } =$ UpdatePanel

<html><body><table><tr><td>Parametername</td><td>Parameter value</td><td>Description</td></tr><tr><td>check</td><td>true</td><td>Force check for updates[Optional]</td></tr><tr><td>force</td><td>true</td><td>Perform an update [Optional]</td></tr></table></body></html>

# Response content：

<html><body><table><tr><td>Field</td><td> Field value example</td><td>Description</td></tr><tr><td>status</td><td>true</td><td>Get state true|false</td></tr><tr><td>version</td><td>6.3.1</td><td>Latest version number</td></tr><tr><td>updateMsg</td><td>string</td><td>Upgrade Instructions</td></tr></table></body></html>

Response content example：   
{ "status": true, "version": "6.3.1", "updateMsg": "Upgrade Instructions"   
}

# Website management

# Get a list of websites

URI address：/data?action $\mid =$ getData&table $\mathrel { \mathop : } =$ sites   

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>p</td><td>1</td><td>Current page [optional]</td></tr><tr><td>limit</td><td>15</td><td>Number of rows retrieved [must pass]</td></tr><tr><td>type</td><td>-1</td><td>Classification ID,-1: Sub-category O: Default classification [Optional]</td></tr><tr><td>order</td><td>id desc</td><td>Sorting rules Use id descending order: id desc Use name ascending order: name desc [Optional]</td></tr><tr><td>tojs</td><td>get_site_list</td><td>Paginated JS callback, if not passed,construct URl paging connection [Optional]</td></tr><tr><td>search</td><td>www</td><td>Search content [optional]</td></tr></table></body></html>

# Response content：

<html><body><table><tr><td>Field</td><td>Field value example</td><td>Description</td></tr><tr><td>data</td><td></td><td>Site list data</td></tr><tr><td>page</td><td></td><td>Paging data</td></tr><tr><td>where</td><td>type_id=0</td><td>Data query condition</td></tr></table></body></html>

Response content example：   
{ "data": [ {

"status": "1", "ps": "bbb.com", "domain": 1, "name": "bbb.com", "addtime": "2018-12-14 16:14:03", "path": "/www/wwwroot/bbb.com", "backup_count": 0, "edate": "0000-00-00", "id": 64 } ], "where": "type_id=0", "page": "<div><span class $\mathrel { \mathop : }$ Pcurrent'>1</span><span class='Pcount'>\u51711\u6761\u6570\u636e</span></div>" }

# Get website classification

URI address：/site?action=get_site_types   
Incoming parameters: empty   
Response content example：   
[ {"id": 0, "name": "\u9ed8\u8ba4\u5206\u7c7b"}   
]

# Get a list of installed PHP versions

URI address：/site?action=GetPHPVersion   
Incoming parameters: empty   
Response content example：   
[ {"version": "00", "name": "\u7eaf\u9759\u6001"}, {"version": "56", "name": "PHP-56"}, {"version": "72", "name": "PHP-72"}   
]

# Create a website

# URI address：/site?action=AddSite

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>webname</td><td>{"domain":"w1.hao.com","domainlist":[],"count":0}</td><td>Website main domain name and domain name list Please pass JSON [Must]</td></tr><tr><td>path</td><td>/www/wwwroot/w1.hao.com</td><td>Root directory [Must]</td></tr><tr><td>type_id</td><td>0</td><td>Classification mark[Must]</td></tr><tr><td>type</td><td>PHP</td><td>Project type Please pass PHP [Must]</td></tr><tr><td>version</td><td>72</td><td>PHP version Please select from the PHP version list [Must]</td></tr><tr><td>port</td><td>80</td><td>Website port [Must]</td></tr></table></body></html>

<html><body><table><tr><td>ps</td><td>test</td><td>Website Remarks [Must]</td></tr><tr><td>ftp</td><td>true|false</td><td>Whether to create FTP[Must]</td></tr><tr><td>ftp_username</td><td>w1_hao_com</td><td>FTP username must be passed when you want to create FTP</td></tr><tr><td>ftp_password</td><td>WCBZ6cH87raERzXc</td><td>FTP password must be passed when you want to create FTP</td></tr><tr><td>sql codeing</td><td>true|false utf8|utf8mb4|gbk|big5</td><td>Whether to createa database [Must] Database character set must pass when you want to create a database </td></tr><tr><td>datauser</td><td>w1_hao_com</td><td>Database username and name must be passed when you want to create a database</td></tr><tr><td>datapassword</td><td>PdbNjJy5hBA346AR</td><td>Database password must be passed when you want to create a database</td></tr></table></body></html>

# Response content：

<html><body><table><tr><td>Field</td><td>Field value example</td><td>Description</td></tr><tr><td>siteStatus</td><td>true|false</td><td>Whether the website was created successfully</td></tr><tr><td>ftpStatus</td><td>true|false</td><td>Whether FTP is successfully created</td></tr><tr><td>ftpUser</td><td>w2_hao_com</td><td>FTP username</td></tr><tr><td>ftpPass</td><td>sRxmY6xCn6zEsFtG</td><td>FTP password</td></tr><tr><td>databaseStatus</td><td>true |false</td><td>Whether the database was created successfully</td></tr><tr><td>databaseUser</td><td>w2_hao_com</td><td>Database username and name</td></tr><tr><td>databasePass</td><td>PdbNjJy5hBA346AR</td><td>Database password</td></tr></table></body></html>

Response content example： {

"ftpStatus": true,   
"databaseUser": "w2_hao_com",   
"databaseStatus": true,   
"ftpUser": "w2_hao_com",   
"databasePass": "PdbNjJy5hBA346AR",   
"siteStatus": true,   
"ftpPass": "sRxmY6xCn6zEsFtG"

# Delete website

URI address：/site?action $\mid =$ DeleteSite   

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>id</td><td>66</td><td>Website ID [Must]</td></tr><tr><td>webname</td><td>w2_hao_com</td><td>Site name [Must]</td></tr><tr><td>ftp</td><td>1</td><td>Whether to delete the associated FTP,if you do not delete, please do not pass this parameter [Optional]</td></tr><tr><td>database</td><td>1</td><td>Whether to delete the associated database, if you do not delete, please do not pass this parameter [Optional]</td></tr><tr><td>path</td><td>1</td><td>Whether to delete the website root directory, if you do not delete,please do not pass this parameter [Optional]</td></tr></table></body></html>

# Response content：

<html><body><table><tr><td>Field</td><td>Field value example</td><td>Description</td></tr><tr><td>status</td><td>true|false</td><td>Whether the operation is successful</td></tr><tr><td>msg</td><td>successfully deleted!</td><td>Prompt content</td></tr></table></body></html>

Response content example：   
{ "status": true, "msg": "\u7ad9\u70b9\u5220\u9664\u6210\u529f!"   
}

# Stop website

URI address：/site?action=SiteStop

<html><body><table><tr><td>Parameter name</td><td> Parameter value</td><td>Description</td></tr><tr><td>id</td><td>66</td><td>Website ID [Must]</td></tr><tr><td>name</td><td>w2.hao.com</td><td>Website name (main domain) [Must]</td></tr></table></body></html>

Response content example：   
{ "status": true, "msg": "\u7ad9\u70b9\u5220\u9664\u6210\u529f!"   
}

# Start website

URI address：/site?action $\vDash$ SiteStart

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>id</td><td>66</td><td>Website ID [Must]</td></tr><tr><td>name</td><td>w2.hao.com</td><td>Website name (main domain) [Must]</td></tr></table></body></html>

Response content example：   
{ "status": true, "msg": "\u7ad9\u70b9\u5df2\u542f\u7528"   
}

# Website expiration time

URI 地址：/site?action=SetEdate

<html><body><table><tr><td>Parameter name</td><td> Parameter value</td><td>Description</td></tr><tr><td>id</td><td>66</td><td>Website ID[Must]</td></tr><tr><td>edate</td><td>2019-01-01</td><td>Expiration time Permanent: 0000-00-00 [Must]</td></tr></table></body></html>

Response content example：   
{ "status": true, "msg": "\u7ad9\u70b9\u5df2\u542f\u7528"   
}

# Modify website notes

# URI address：/data?action $\mid =$ setPs&table=sites

<html><body><table><tr><td>Parametername</td><td> Parameter value</td><td>Description</td></tr><tr><td>id</td><td>66</td><td>Website ID [Must]</td></tr><tr><td>ps</td><td>test</td><td>Remarks [Must]</td></tr></table></body></html>

Response content example：   
{ "status": true, "msg": "\u4fee\u6539\u6210\u529f"   
}

# Get a list of website backups

# URI address：/data?action $\mid =$ getData&table=backup

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>p</td><td>1</td><td>Current page [Optional]</td></tr><tr><td>limit</td><td>5</td><td>The number of data rows retrieved per page [Must]</td></tr><tr><td>type</td><td>0</td><td>Backup type, please pass O fixed [Must]</td></tr><tr><td>tojs</td><td>get_site_backup</td><td> Paginated JS callback,if not passed, construct URl paging connection [Optional]</td></tr><tr><td>search</td><td>66</td><td>Website ID [Must]</td></tr></table></body></html>

# Response content：

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>data</td><td></td><td>Backup list data</td></tr><tr><td>page</td><td></td><td>Paging data</td></tr><tr><td>where</td><td>type_id=0</td><td>Data query condition</td></tr></table></body></html>

# Response content example：

1 "data": [], "where": "pid $\scriptstyle \mathbf { = 6 5 }$ and type $\ " \mathbf { o } ^ { \prime \prime }$ ", "page": "<div><span class $\mathrel { \mathop : }$ Pcurrent'>1</span><span class='Pcount'>\u51710\u6761\u6570\u636e</span></div>" }

# Create a website backup

URI address：/site?action=ToBackup

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>id</td><td>66</td><td>Website ID [Must]</td></tr></table></body></html>

Response content example：   
{ "status": true, "msg": "\u5907\u4efd\u6210\u529f!"

# Delete website backup

URI address：/site?action=DelBackup

<html><body><table><tr><td> Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>id</td><td>121</td><td>Backup list ID [Must]</td></tr></table></body></html>

Response content example：   
{ "status": true, "msg": "\u5220\u9664\u6210\u529f"   
}

# Get a list of domain names for your site

# URI address：/data?action $\mid =$ getData&table $\ L =$ domain

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td> Description</td></tr><tr><td>search</td><td>66</td><td>Website ID [Must]</td></tr><tr><td>list</td><td>true</td><td>Must pass true</td></tr></table></body></html>

# Response content example：

[ { "port": 80, "addtime": "2018-12-15 16:57:30", "pid": 65, "id": 73, "name": "w1.hao.com" }

# Add domain name

URI address：/site?action=AddDomain

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>id</td><td>66</td><td>Website ID[Must]</td></tr><tr><td>webname</td><td>w2.hao.com</td><td>Sitename[Must]</td></tr><tr><td>domain</td><td>w4.hao.com:81</td><td>The domain name to be added: port 80, the end product does not have to construct a port,and multiple domain names are separated by a newline [Must]</td></tr></table></body></html>

Response content example：   
{ "status": true, "msg": "\u57df\u540d\u6dfb\u52a0\u6210\u529f!"   
}

# Delete domain name

# URI address：/site?action $\mid =$ DelDomain

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>id</td><td>66</td><td>Website ID[Must]</td></tr><tr><td>webname</td><td>w2.hao.com</td><td>Site name [Must]</td></tr><tr><td>domain</td><td>w4.hao.com</td><td>Domain name to be deleted [Must]</td></tr><tr><td>port</td><td>80</td><td>The port of the domain name [Must]</td></tr></table></body></html>

# Response content example：

{ "status": true, "msg": "\u5220\u9664\u6210\u529f"   
}

# Get an optional predefined pseudo-static list

URI address：/site?action=GetRewriteList

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>siteName</td><td>w2.hao.com</td><td>Site name [Must]</td></tr></table></body></html>

# Response content：

<html><body><table><tr><td>Field</td><td> Field value example</td><td>Description</td></tr><tr><td>rewrite</td><td>[</td><td>Predefined pseudo static list</td></tr></table></body></html>

Response content example： {

"rewrite": ["0.\u5f53\u524d", "EmpireCMS", "dabr", "dbshop", "dedecms", "default", "discuz", "discuzx", "discuzx2", "discuzx3", "drupal", "ecshop", "emlog", "laravel5", "maccms", "mvc", "niushop", "phpcms", "phpwind", "sablog", "seacms", "shopex", "thinkphp", "typecho", "typecho2", "weengine", "wordpress", "wp2", "zblog"] }

# Get the specified predefined pseudo-static rule content (get the file content)

URI address：/files?action=GetFileBody

<html><body><table><tr><td>Field</td><td>Field value example</td><td>Description</td></tr><tr><td>path</td><td>/www/server/panel/vhost/rewrite/nginx/name.con f</td><td>The file to be obtained [Must]</td></tr></table></body></html>

# Save pseudo static rule content (save file content)

URI address：/files?action=SaveFileBody

<html><body><table><tr><td>Field</td><td> Field value example</td><td>Description</td></tr><tr><td>path</td><td>/www/server/panel/vhost/rewrite/nginx/名称.conf</td><td>Save location [Must]</td></tr><tr><td>data</td><td></td><td>Rule content</td></tr></table></body></html>

<html><body><table><tr><td>encoding</td><td>utf-8</td><td>File code, please pass it utf-8</td></tr></table></body></html>

# Retrieve the root of the specified website

# URI address：/data?action=getKey&table $\mathbf { \tau } =$ sites&key=path

<html><body><table><tr><td>Field</td><td>Field value example</td><td>Description</td></tr><tr><td>id</td><td>1</td><td>Website ID [Must]</td></tr></table></body></html>

# Retrieve anti-cross-hop configuration/run directory/log switch status/settable run directory list/password access status

URI 地址：/site?action=GetDirUserINI

<html><body><table><tr><td>Field</td><td> Field value example</td><td>Description</td></tr><tr><td>id</td><td>1</td><td>Website ID [Must]</td></tr><tr><td>path</td><td>/www/wwwroot/w1.if22.cn</td><td>Website root directory [Must]</td></tr></table></body></html>

Response content example： {

"pass": false, #Whether to set password access "logs": true, #Whether to write access logs "userini": true, #Whether to set up anti-crossing station "runPath": { "dirs": ["/"], #List of directories that can be used to set the run directory "runPath": "/" #Current running directory } }

# Set anti-crossing status (automatic reversal)

URI address：/site?action=SetDirUserINI

<html><body><table><tr><td>Field</td><td>Field value example</td><td>Description</td></tr><tr><td>path</td><td>/www/wwwroot/w1.if22.cn</td><td>Website root directory [Must]</td></tr></table></body></html>

# Set whether to write access logs

URI address：/site?action=logsOpen

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>id</td><td>1</td><td>Website ID [Must]</td></tr></table></body></html>

# Modify the website root directory

URI address：/site?action=SetPath

<html><body><table><tr><td>Parameter name</td><td> Parameter value</td><td>Description</td></tr><tr><td>id</td><td>1</td><td>Website ID [Must]</td></tr><tr><td>path</td><td>/www/wwwroot/w1.if22.cn</td><td>New website root directory [Must]</td></tr></table></body></html>

# Set whether to write access logs

# URI address：/site?action $\vartriangleleft$ SetSiteRunPath

<html><body><table><tr><td> Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>id</td><td>1</td><td>Website ID[Must]</td></tr><tr><td>runPath</td><td>/public</td><td>Run directory based on the root of the website</td></tr></table></body></html>

# Set password access

URI address：/site?action=SetHasPwd   

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>id</td><td>1</td><td>Website ID [Must]</td></tr><tr><td>username</td><td>test</td><td>username</td></tr><tr><td>password</td><td>admin</td><td>password</td></tr></table></body></html>

# Turn off password access

URI address：/site?action=CloseHasPwd

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>id</td><td>1</td><td>Website ID [Must]</td></tr></table></body></html>

# Get traffic limit related configuration (only supports nginx)

URI address：/site?action=GetLimitNet

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>id</td><td>1</td><td>Website ID [Must]</td></tr></table></body></html>

# Enable or save traffic limit configuration (only nginx is supported)

URI 地址：/site?action $\Rightarrow$ etLimitNet

<html><body><table><tr><td>Parameter name</td><td> Parameter value</td><td>Description</td></tr><tr><td>id</td><td>1</td><td>Website ID[Must]</td></tr><tr><td>perserver</td><td>300</td><td>Concurrency restrictions [Must]</td></tr><tr><td>perip</td><td>25</td><td>Single IP limit [Must]</td></tr><tr><td>limit_rate</td><td>512</td><td>Traffic limit [Must]</td></tr></table></body></html>

# Turn off traffic limits (only nginx is supported)

URI address：/site?action=CloseLimitNet

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>id</td><td>1</td><td>Website ID [Must]</td></tr></table></body></html>

# Take the default document information

URI address：/site?action=GetIndex

<html><body><table><tr><td> Parameter name</td><td>Parameter value</td><td>Description</td></tr></table></body></html>

<html><body><table><tr><td>id</td><td>1</td><td>Website ID [Must]</td></tr></table></body></html>

# Set default document

URI address：/site?action $\mid =$ SetIndex

<html><body><table><tr><td>Parameter name</td><td> Parameter value</td><td>Description</td></tr><tr><td>id</td><td>1</td><td>Website ID [Must]</td></tr><tr><td>Index</td><td>index.php,index.html,index.htm,default.ph p,default.htm,default.html</td><td>Default document,each separated by a comma [Must]</td></tr></table></body></html>

# Take the content of the website configuration file (get the file content)

URI address：/files?action=GetFileBody

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>path</td><td>/www/server/panel/vhost/nginx/name.conf</td><td>The file to be obtained [Must]</td></tr></table></body></html>

# Save the website configuration file (save the file content)

URI address：/files?action $\scriptstyle 1 = 1$ SaveFileBody

<html><body><table><tr><td>Parameter name</td><td>Parameter value</td><td>Description</td></tr><tr><td>path</td><td>/www/server/panel/vhost/nginx/name.conf</td><td>Save location [Must]</td></tr><tr><td>data</td><td></td><td>Profile content</td></tr><tr><td>encoding</td><td>utf-8</td><td>File encoding Please fillin utf-8</td></tr></table></body></html>