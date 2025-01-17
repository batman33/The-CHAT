import AttachmentPreview from "@/Components/App/AttachmentPreview.jsx";
import AudioRecorder from "@/Components/App/AudioRecorder.jsx";
import CustomAudioPlayer from "@/Components/App/CustomAudioPlayer.jsx";
import { isAudio, isImage } from "@/helpers.jsx";
import { XCircleIcon } from "@heroicons/react/24/solid/index.js";
import EmojiPicker from "emoji-picker-react";
import { Fragment, useState } from "react";
import { Popover, Transition } from "@headlessui/react";
import {
  FaceSmileIcon,
  HandThumbUpIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";

import NewMessageInput from "@/Components/App/NewMessageInput.jsx";

export const MessageInput = ({ conversation }) => {
  const [ inputErrorMessage, setInputErrorMessage ] = useState("");
  const [ messageSending, setMessageSending ] = useState(false);
  const [ newMessage, setNewMessage ] = useState("");
  const [ chosenFiles, setChosenFiles ] = useState([]);
  const [ uploadProgress, setUploadProgress ] = useState(0);

  const onFileChange = (event) => {
    const files = event.target.files;

    const updatedFiles = [ ...files ].map((file) => {
      return {
        file,
        url: URL.createObjectURL(file),
      }
    });

    event.target.value = null;

    setChosenFiles((prevFiles) => {
      return [ ...prevFiles, ...updatedFiles ];
    })
  }

  const onSendClick = () => {
    if (messageSending) {
      return;
    }

    if (newMessage.trim() === "" && chosenFiles.length === 0) {
      setInputErrorMessage("Please provide a message or upload attachments.");

      setTimeout(() => {
        setInputErrorMessage("");
      }, 3000);

      return;
    }

    const formData = new FormData();

    chosenFiles.forEach((file) => {
      formData.append("attachments[]", file.file);
    });

    formData.append("message", newMessage);

    if (conversation.is_user) {
      formData.append("receiver_id", conversation.id);
    } else if (conversation.is_group) {
      formData.append("group_id", conversation.id);
    }

    setMessageSending(true);

    axios.post(route("message.store"), formData, {
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
        setUploadProgress(progress);
      },
    }).then(() => {
      setNewMessage("");
    }).catch((error) => {
      const message = error?.response?.data?.message;

      setInputErrorMessage(message || "An error occurred while sending message");
    }).finally(() => {
      setChosenFiles([]);
      setMessageSending(false);
      setUploadProgress(0);
    });
  }

  const onLikeClick = (event) => {
    if (messageSending) {
      return;
    }

    const data = {
      message: "👍",
    };

    if (conversation.is_user) {
      data.receiver_id = conversation.id;
    } else if (conversation.is_group) {
      data.group_id = conversation.id;
    }

    axios.post(route("message.store"), data);
  }

  const recordedAudioReady = (file, url) => {
    setChosenFiles((prevFiles) => [ ...prevFiles, { file, url } ])
  }

  return (
    <div className="flex flex-wrap items-start border-t border-slate-700 py-3">
      <div className="order-2 flex-1 xs:flex-none xs:order-1 p-2">
        <button type="button" className="p-1 text-gray-400 hover:text-gray-300 relative">
          <PaperClipIcon className="w-6" />
          <input onChange={onFileChange} type="file" multiple className="absolute left-0 top-0 right-0 bottom-0 z-20 opacity-0 cursor-pointer" />
        </button>
        <button type="button" className="p-1 text-gray-400 hover:text-gray-300 relative">
          <PhotoIcon className="w-6" />
          <input onChange={onFileChange}
                 type="file"
                 multiple
                 accept="image/*"
                 className="absolute left-0 top-0 right-0 bottom-0 z-20 opacity-0 cursor-pointer" />
        </button>
        <AudioRecorder fileReady={recordedAudioReady} />
      </div>
      <div className="order-1 px-3 xs:p-0 min-w-[220px] basis-full xs:basis-0 xs:order-2 flex-1 relative">
        <div className="flex">
          <NewMessageInput
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            onSend={onSendClick}
          />
          <button onClick={onSendClick} disabled={messageSending} type="button" className="btn btn-info rounded-l-none">
            {messageSending && (
              <span className="loading loading-spinner loading-xs"></span>
            )}
            <PaperAirplaneIcon className="w-6" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        {!!uploadProgress && (
          <progress className="progress progress-info w-full" value={uploadProgress} max="100"></progress>
        )}
        {inputErrorMessage && (
          <p className="text-xs text-red-400">{inputErrorMessage}</p>
        )}
        {chosenFiles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {chosenFiles.map((file) => (
              <div
                key={file.file.name}
                className={`relative flex justify-between cursor-pointer ${!isImage(file.file) ? 'w-[240px]' : ''}`}
              >
                {isImage(file.file) && (
                  <img src={file.url} alt={file.file.name} className="w-16 h-16 object-cover" />
                )}
                {isAudio(file.file) && (
                  <CustomAudioPlayer
                    file={file}
                    showVolume={false}
                  />
                )}
                {!isImage(file.file) && !isAudio(file.file) && (
                  <AttachmentPreview file={file} />
                )}

                <button className="absolute w-6 h-6 rounded-full bg-gray-800 -right-2 -top-2 text-gray-300 hover:text-gray-100 z-10"
                        type="button"
                        onClick={() => {
                          setChosenFiles(chosenFiles.filter(f => f.file.name !== file.file.name));
                        }}>
                  <XCircleIcon className="w-6" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="order-3 xs:order-3 p-2 flex">
        <Popover className="relative">
          <Popover.Button className="p-1 text-gray-400 hover:text-gray-300">
            <FaceSmileIcon className="w-6 h-6" />
          </Popover.Button>
          <Popover.Panel className="absolute z-10 right-0 bottom-full">
            <EmojiPicker theme="dark" onEmojiClick={(event) => setNewMessage(newMessage + event.emoji)} />
          </Popover.Panel>
        </Popover>
        <button type="button" className="p-1 text-gray-400 hover:text-gray-300" onClick={onLikeClick}>
          <HandThumbUpIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

