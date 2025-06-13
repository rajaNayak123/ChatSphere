import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Message from "@/lib/models/Message";

export async function POST(req: NextRequest, {params}: {params: {messageId:string}}) {
   try {
    const session = await getServerSession(authOptions);

    if(!session?.user?.id){
        return NextResponse.json(
            {error:"Unauthorized"},
            {status:401}
        )
    }

    await connectDB();

    const message = await Message.findById(params.messageId)

    if(!message){
        return NextResponse.json(
            {error:"Message is not found"},
            {status:404}
        )
    }

    const alreadySeen = message.seenBy.some((seen:any) =>seen.user.toString() === session.user.id)

    if(!alreadySeen){
        message.seenBy.push({
            user: session.user.id,
            seenAt: new Date()
        })

        await message.save()
    }

    return NextResponse.json({ success: true });

   } catch (error) {
        console.error('Mark message as seen error:', error);
        return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
        );
   }
}
