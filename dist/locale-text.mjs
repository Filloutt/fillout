import {language} from './ui.mjs';
import {zh} from './locale-zh.mjs';
const patterns=[
 [/^Step (\d+)$/,m=>'步骤 '+m[1]],[/^(\d+) (Quote|Settle)$/,m=>m[1]+' '+(m[2]==='Quote'?'逻辑元件':'记忆元件')],
 [/^(\d+) steps? completed\. (.*)$/,m=>'已完成 '+m[1]+' 步。'+translate(m[2])],
 [/^Connected: (.*)$/,m=>'已连接：'+m[1]],[/^Continue in (.*)…$/,m=>'请在 '+m[1]+' 中继续…'],[/^Confirm the FillOut connection message in (.*)…$/,m=>'请在 '+m[1]+' 中确认 FillOut 连接消息…'],
 [/^Connected to (.*)\. Connection message verified\. No transaction requested\.$/,m=>'已连接至 '+m[1]+'。连接消息已验证，未请求交易。'],[/^Copy unavailable\. Address: (.*)$/,m=>'无法复制。地址：'+m[1]],
 [/^Manage connected wallet (.*)$/,m=>'管理已连接的钱包 '+m[1]],[/^Submission received: (.*)\. Whitelist eligibility is subject to manual review\.$/,m=>'申请已收到：'+m[1]+'。白名单资格须经人工审核。'],
 [/^Add (Input|Quote|Settle|Output) to the board$/,m=>'将'+translate(m[1])+'添加到电路板'],[/^Input port (\d+)$/,m=>'输入端口 '+m[1]],[/^Disconnect wire (.*)$/,m=>'断开连线 '+m[1]],
 [/^(Website|Wallet|Nonce|Issued at): (.*)$/,m=>translate(m[1]+':')+m[2]],[/^(OpenBook|FillOut) Quote \/ Settle will be used for this circuit\.$/,m=>'此电路将使用 '+m[1]+' 的逻辑与记忆元件。'],
 [/^Memory: (.*)$/,m=>'记忆：'+m[1]]
];
export function translate(value){const text=String(value),trim=text.trim();if(!trim)return text;if(Object.hasOwn(zh,trim))return text.replace(trim,zh[trim]);for(const [pattern,format] of patterns){const match=trim.match(pattern);if(match)return text.replace(trim,format(match));}return text;}
export function localizedMessage(value){return language==='zh'?String(value).split('\n').map(translate).join('\n'):value;}
