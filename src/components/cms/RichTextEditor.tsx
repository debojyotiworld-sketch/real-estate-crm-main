import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const modules = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],

    [{ font: [] }],
    [{ size: ["small", false, "large", "huge"] }],

    [{ color: [] }, { background: [] }],

    [{ script: "sub" }, { script: "super" }],

    [{ header: [1, 2, 3, 4, 5, 6, false] }],

    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],

    [{ align: [] }],

    ["link", "image", "video"],

    ["clean"],
  ],
};

const formats = [
  "bold", "italic", "underline", "strike",
  "font", "size",
  "color", "background",
  "script",
  "header",
  "list", "bullet", "indent",
  "align",
  "link", "image", "video",
];

const RichTextEditor = ({ value, onChange }: any) => {
  return (
    <div className="bg-white rounded-xl border">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        className="min-h-[300px]"
      />
    </div>
  );
};

export default RichTextEditor;
