import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Chat from '@/lib/models/Chat';
import Message from '@/lib/models/Message';
import User from '@/lib/models/User';


export async function GET(req: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      await connectDB();
  
      const chats = await Chat.find({
        participants: session.user.id,
      })
        .populate({
          path: 'participants',
          select: 'name email avatar isOnline lastSeen',
          model: User,
        })
        .populate({
          path: 'lastMessage',
          select: 'content sender createdAt',
          model: Message,
          populate: {
            path: 'sender',
            select: 'name',
            model: User,
          },
        })
        .sort({ lastActivity: -1 });
  
      return NextResponse.json(chats);
    } catch (error) {
      console.error('Get chats error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
  
  export async function POST(req: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const { participantIds, isGroup = false, groupName } = await req.json();
  
      if (!participantIds || participantIds.length === 0) {
        return NextResponse.json(
          { error: 'Participants are required' },
          { status: 400 }
        );
      }
  
      await connectDB();
  
      // Add current user to participants
      const allParticipants = [...new Set([session.user.id, ...participantIds])];
  
      // For one-to-one chats, check if chat already exists
      if (!isGroup && allParticipants.length === 2) {
        const existingChat = await Chat.findOne({
          participants: { $all: allParticipants, $size: 2 },
          isGroup: false,
        });
  
        if (existingChat) {
          return NextResponse.json(existingChat);
        }
      }
  
      const chatData: any = {
        participants: allParticipants,
        isGroup,
        lastActivity: new Date(),
      };
  
      if (isGroup) {
        chatData.groupName = groupName;
        chatData.admin = session.user.id;
      }
  
      const chat = await Chat.create(chatData);
  
      const populatedChat = await Chat.findById(chat._id)
        .populate({
          path: 'participants',
          select: 'name email avatar isOnline lastSeen',
          model: User,
        });
  
      return NextResponse.json(populatedChat);
    } catch (error) {
      console.error('Create chat error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }