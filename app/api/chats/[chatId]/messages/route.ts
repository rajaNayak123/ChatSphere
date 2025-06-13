import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import User from "@/lib/models/User";
import Chat from "@/lib/models/Chat";

export async function GET(req:NextRequest, {params}: {params: {chatId:string}}){
    try {
        const session = await getServerSession(authOptions)

        if(!session?.user?.id){
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {searchParams} = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        await connectDB();

        // Verify user is participant in the chat
        const chat = await Chat.findById(params.chatId)

        if(!chat || !chat.participants.includes(session.user.id)){
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const messages = await Message.find({ chat: params.chatId })
        .populate({
          path: 'sender',
          select: 'name avatar',
          model: User,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
  
      const totalMessages = await Message.countDocuments({ chat: params.chatId });
      const hasMore = skip + messages.length < totalMessages;
  
      return NextResponse.json({
        messages: messages.reverse(), // Reverse to show oldest first
        hasMore,
        page,
        totalPages: Math.ceil(totalMessages / limit),
      });

    } catch (error) {
        console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    }
}


export async function POST( req: NextRequest, { params }: { params: { chatId: string } }) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const { content, messageType = 'text' } = await req.json();
  
      if (!content?.trim()) {
        return NextResponse.json(
          { error: 'Message content is required' },
          { status: 400 }
        );
      }
  
      await connectDB();
  
      // Verify user is participant in the chat
      const chat = await Chat.findById(params.chatId);
      if (!chat || !chat.participants.includes(session.user.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
  
      // Create message
      const message = await Message.create({
        chat: params.chatId,
        sender: session.user.id,
        content,
        messageType,
      });
  
      // Update chat's last activity and last message
      await Chat.findByIdAndUpdate(params.chatId, {
        lastMessage: message._id,
        lastActivity: new Date(),
      });
  
      // Populate sender info
      const populatedMessage = await Message.findById(message._id)
        .populate({
          path: 'sender',
          select: 'name avatar',
          model: User,
        });
  
      return NextResponse.json(populatedMessage);
    } catch (error) {
      console.error('Send message error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }