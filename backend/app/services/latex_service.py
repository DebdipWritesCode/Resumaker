import subprocess
import sys
import os
from typing import Optional

def compile_latex(input_file: str, output_name: str, output_dir: str = ".") -> Optional[str]:
    """
    Compile a LaTeX file to PDF using pdflatex.
    
    Args:
        input_file: Path to the input .tex file
        output_name: Name for the output PDF (without extension)
        output_dir: Directory to output the PDF (default: current directory)
    
    Returns:
        Path to the generated PDF if successful, None otherwise
    """
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"LaTeX file not found: {input_file}")
    
    try:
        # Run pdflatex with non-interactive mode
        # -interaction=nonstopmode: Don't stop for errors
        # -output-directory: Output to specified directory
        result = subprocess.run(
            ['pdflatex', '-interaction=nonstopmode', f'-output-directory={output_dir}', input_file],
            capture_output=True,
            text=True,
            check=False
        )
        
        if result.returncode == 0:
            # Get the output PDF path
            input_basename = os.path.splitext(os.path.basename(input_file))[0]
            output_pdf = os.path.join(output_dir, f"{input_basename}.pdf")
            
            if output_name != input_basename:
                final_output = os.path.join(output_dir, f"{output_name}.pdf")
                if os.path.exists(output_pdf):
                    os.rename(output_pdf, final_output)
                    return final_output
            else:
                if os.path.exists(output_pdf):
                    return output_pdf
            
            return None
        else:
            error_msg = f"LaTeX compilation failed:\n{result.stdout}\n{result.stderr}"
            raise RuntimeError(error_msg)
            
    except FileNotFoundError:
        raise RuntimeError("pdflatex not found! Make sure LaTeX is installed and in PATH.")
    except Exception as e:
        raise RuntimeError(f"Error during LaTeX compilation: {str(e)}")

