<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 *
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property int $owner_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property int|null $last_message_id
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Message> $messages
 * @property-read int|null $messages_count
 * @property-read \App\Models\User $owner
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\User> $users
 * @property-read int|null $users_count
 * @method static \Database\Factories\GroupFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder|Group newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Group newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Group query()
 * @method static \Illuminate\Database\Eloquent\Builder|Group whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Group whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Group whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Group whereLastMessageId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Group whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Group whereOwnerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Group whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Group extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'owner_id',
        'last_message_id',
    ];

    public function users(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_users');
    }

    public function messages(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function owner(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lastMessage()
    {
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    public static function getGroupsForUser(User $user)
    {
        $query = self::select([
            'groups.*',
            'messages.message as last_message',
            'messages.created_at as last_message_date'
        ])->join('group_users', 'group_users.group_id', '=', 'groups.id')->leftJoin(
            'messages',
            'messages.id',
            '=',
            'groups.last_message_id'
        )->where('group_users.user_id', '=', $user->id)->orderBy('messages.created_at', 'desc')->orderBy(
            'groups.name'
        );

        return $query->get();
    }


    public function toConversationArray()
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'description'       => $this->description,
            'is_group'          => true,
            'is_user'           => false,
            'owner_id'          => $this->owner_id,
            'users'             => $this->users,
            'user_ids'          => $this->users->pluck('id'),
            'created_at'        => $this->created_at,
            'updated_at'        => $this->updated_at,
            'last_message'      => $this->last_message,
            'last_message_date' => $this->last_message_date ? $this->last_message_date.' UTC' : null,
        ];
    }

    public static function updateGroupWithMessage($groupId, $message): Model|Group
    {
        return self::updateOrCreate(
            ['id' => $groupId], ['last_message_id' => $message->id]
        );
    }
}
