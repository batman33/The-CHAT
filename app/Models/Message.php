<?php

namespace App\Models;

use App\Observers\MessageObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 *
 *
 * @property int $id
 * @property string|null $message
 * @property int $sender_id
 * @property int|null $receiver_id
 * @property int|null $group_id
 * @property int|null $conversation_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\MessageAttachment> $attachments
 * @property-read int|null $attachments_count
 * @property-read \App\Models\Group|null $group
 * @property-read \App\Models\User|null $receiver
 * @property-read \App\Models\User $sender
 * @method static \Database\Factories\MessageFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder|Message newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Message newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Message query()
 * @method static \Illuminate\Database\Eloquent\Builder|Message whereConversationId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Message whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Message whereGroupId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Message whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Message whereMessage($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Message whereReceiverId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Message whereSenderId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Message whereUpdatedAt($value)
 * @mixin \Eloquent
 */
#[ObservedBy([MessageObserver::class])]
class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'message',
        'sender_id',
        'group_id',
        'receiver_id',
    ];

    public function sender(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function group(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Group::class, 'group_is');
    }

    public function attachments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(MessageAttachment::class, 'message_id');
    }
}
