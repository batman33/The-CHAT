<?php

namespace App\Http\Controllers;

use App\Events\SocketMessage;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    public function byUser(User $user): \Inertia\Response|\Inertia\ResponseFactory
    {
        $messages = Message::where('sender_id', auth()->id())->where('receiver_id', $user->id)->orWhere(
            'sender_id',
            $user->id
        )->where('receiver_id', auth()->id())->latest()->paginate(30);

        return inertia('Home', [
            'selectedConversation' => $user->toConversationArray(),
            'messages'             => MessageResource::collection($messages),
        ]);
    }

    public function byGroup(Group $group): \Inertia\Response|\Inertia\ResponseFactory
    {
        $messages = Message::where('group_id', $group->id)->latest()->paginate(30);

        return inertia('Home', [
            'selectedConversation' => $group->toConversationArray(),
            'messages'             => MessageResource::collection($messages),
        ]);
    }

    public function loadOlder(Message $message): AnonymousResourceCollection
    {
        if ($message->group_id) {
            $messages = Message::where('created_at', '<', $message->created_at)
                               ->where('group_id', $message->group_id)
                               ->latest()
                               ->paginate(10);
        } else {
            $messages = Message::where('created_at', '<', $message->created_at)->where(
                function ($query) use ($message) {
                    $query->where('sender_id', $message->sender_id)
                          ->where('receiver_id', $message->receiver_id)
                          ->orWhere('sender_id', $message->receiver_id)
                          ->where('receiver_id', $message->sender_id);
                }
            )->latest()->paginate(10);
        }

        return MessageResource::collection($messages);
    }

    public function store(StoreMessageRequest $request): MessageResource
    {
        $data = $request->validated();

        $data['sender_id']   = auth()->id();
        $data['receiver_id'] = isset($data['receiver_id']) ? (int)$data['receiver_id'] : null;
        $data['group_id']    = isset($data['group_id']) ? (int)$data['group_id'] : null;

        $receiverId = $data['receiver_id'];
        $groupId    = $data['group_id'];

        $files = $data['attachments'] ?? [];

        $message = Message::create($data);

        $attachments = [];
        if ($files) {
            foreach ($files as $file) {
                $directory = 'attachments'.Str::random(32);
                Storage::makeDirectory($directory);

                $model         = [
                    'message_id' => $message->id,
                    'name'       => $file->getClientOriginalName(),
                    'mime'       => $file->getClientMimeType(),
                    'size'       => $file->getSize(),
                    'path'       => $file->store($directory, 'public'),
                ];
                $attachment    = MessageAttachment::create($model);
                $attachments[] = $attachment;
            }

            $message->attachments = $attachments;
        }

        if ($receiverId) {
            Conversation::updateConversationWithMessage($receiverId, auth()->id(), $message);
        }

        if ($groupId) {
            Group::updateGroupWithMessage($groupId, $message);
        }

        SocketMessage::dispatch($message);

        return new MessageResource($message);
    }

    public function destroy(Message $message
    ): \Illuminate\Foundation\Application|Response|JsonResponse|Application|ResponseFactory {
        // Check if the user is the owner of the message
        if ($message->sender_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $group        = null;
        $conversation = null;
        $lastMessage  = null;

        // Check if the message is the group message
        if ($message->group_id) {
            $group = Group::where('last_message_id', $message->id)->first();
        } else {
            $conversation = Conversation::where('last_message_id', $message->id)->first();
        }

        $message->delete();

        if ($group) {
            $group       = Group::find($group->id);
            $lastMessage = $group->lastMessage;
        } elseif ($conversation) {
            $conversation = Conversation::find($conversation->id);
            $lastMessage  = $conversation->lastMessage;
        }

        return response()->json($lastMessage ? new MessageResource($lastMessage) : null);
    }
}
