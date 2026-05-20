import zipfile
import xml.etree.ElementTree as ET
import sys

def get_docx_text(path):
    try:
        doc = zipfile.ZipFile(path)
        xml_content = doc.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        text = []
        for paragraph in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            p_text = []
            for run in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                if run.text:
                    p_text.append(run.text)
            text.append("".join(p_text))
        return "\n".join(text)
    except Exception as e:
        return str(e)

if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else "Assignment 1 - Task 2.docx"
    text = get_docx_text(path)
    with open("assignment_task2.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Done writing to assignment_task2.txt")
