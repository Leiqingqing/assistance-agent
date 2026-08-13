import { InboxChatRequestSchema } from "@repo/contracts/chat";
import type { z } from "zod";

export type InboxChatMail = z.infer<
  typeof InboxChatRequestSchema
>["mail"];

export type InboxConversation = {
  id: string;
  mail: InboxChatMail;
  preview: string;
  time: string;
  unread?: boolean;
};

export const inboxConversations: [InboxConversation, ...InboxConversation[]] = [
  {
    id: "delivery-delay",
    mail: {
      subject: "订单什么时候可以发货？",
      sender: "林夏",
      senderEmail: "linxia@example.com",
      teaser: "客户询问订单 A-20260812-031 的发货进度，希望能在周五前收到。",
    },
    preview: "你好，我的订单已经两天没有更新物流了……",
    time: "10:42",
    unread: true,
  },
  {
    id: "refund-policy",
    mail: {
      subject: "关于退款流程的咨询",
      sender: "周明",
      senderEmail: "zhouming@example.com",
      teaser: "客户购买的年度套餐尚未启用，想了解退款流程和预计到账时间。",
    },
    preview: "如果服务还没有开始使用，可以申请退款吗？",
    time: "09:18",
    unread: true,
  },
  {
    id: "product-plan",
    mail: {
      subject: "企业版支持哪些协作功能？",
      sender: "陈默",
      senderEmail: "chenmo@example.com",
      teaser: "客户正在为 30 人团队评估企业版，重点关注权限、审批和使用报表。",
    },
    preview: "我们团队大约有 30 人，需要分角色管理……",
    time: "昨天",
  },
  {
    id: "invoice-request",
    mail: {
      subject: "补开上个月的增值税发票",
      sender: "苏晴",
      senderEmail: "suqing@example.com",
      teaser: "客户需要为上月订单补开增值税专用发票，并询问需要提供的资料。",
    },
    preview: "财务这边需要补开专票，请问在哪里提交信息？",
    time: "周一",
  },
  {
    id: "account-login",
    mail: {
      subject: "更换手机号后无法登录",
      sender: "王辰",
      senderEmail: "wangchen@example.com",
      teaser: "客户更换了手机号，旧号码已停用，当前无法通过验证码登录账号。",
    },
    preview: "原来的手机号不用了，现在收不到验证码。",
    time: "8月9日",
  },
];
