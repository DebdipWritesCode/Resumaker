import subprocess
import sys
import os

def compile_latex(input_file, output_name):
    """
    Compile a LaTeX file to PDF using pdflatex.
    
    Args:
        input_file: Path to the input .tex file
        output_name: Name for the output PDF (without extension)
    """
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found!")
        sys.exit(1)
    
    print(f"Compiling {input_file} to PDF...")
    
    try:
        # Run pdflatex with non-interactive mode
        # -interaction=nonstopmode: Don't stop for errors
        # -output-directory=.: Output to current directory
        result = subprocess.run(
            ['pdflatex', '-interaction=nonstopmode', '-output-directory=.', input_file],
            capture_output=True,
            text=True,
            check=False
        )
        
        if result.returncode == 0:
            # Rename the output PDF if needed
            input_basename = os.path.splitext(os.path.basename(input_file))[0]
            output_pdf = f"{input_basename}.pdf"
            if output_name != input_basename:
                if os.path.exists(output_pdf):
                    final_output = f"{output_name}.pdf"
                    os.rename(output_pdf, final_output)
                    print(f"✓ Successfully compiled to {final_output}")
                else:
                    print(f"✓ Successfully compiled to {output_pdf}")
            else:
                print(f"✓ Successfully compiled to {output_pdf}")
        else:
            print("Error: LaTeX compilation failed!")
            print("\n--- LaTeX Output ---")
            print(result.stdout)
            print("\n--- LaTeX Errors ---")
            print(result.stderr)
            sys.exit(1)
            
    except FileNotFoundError:
        print("Error: pdflatex not found! Make sure LaTeX is installed and in PATH.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    input_file = "input.tex"
    output_name = "output"
    
    compile_latex(input_file, output_name)
