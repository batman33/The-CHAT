import { useEffect, useRef } from "react";

const NewMessageInput = ({ value, onChange, onSend }) => {
  const input = useRef();

  const onInputKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  const onChangeEvent = (event) => {
    setTimeout(() => {
      adjustHeight();
    }, 10);
    onChange(event);
  }

  const adjustHeight = () => {
    setTimeout(() => {
      if (input.current) {
        input.current.style.height = 'auto';
        input.current.style.height = input.current.scrollHeight + 1 + "px";
      }
    }, 100);
  }

  useEffect(() => {
    adjustHeight();
  }, [ value ]);

  return (
    <textarea
      ref={input}
      value={value}
      rows={1}
      placeholder="Type a message"
      onKeyDown={onInputKeyDown}
      onChange={onChangeEvent}
      className="input input-bordered w-full rounded-r-none resize-none overflow-y-auto max-h-40"
    >

    </textarea>
  )
}

export default NewMessageInput;
