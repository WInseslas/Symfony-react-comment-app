import React, { Children } from "react"
import { Icon } from "./Icon"

export const Field = React.forwardRef(({ help, name, children, error, onChange, required, minLength }, ref) => {

    const className = (...arr) => arr.filter(Boolean).join(" ")
    if (error) {
        help = error
    }

    return <div className={className("form-group", error && "has-error")}>
        <label className="sr-only control-label required" htmlFor={name}>{children}</label>
        <textarea ref={ref} 
            name={name} id={name} 
            cols="30" rows="10" 
            className="form-control" 
            onChange={onChange} 
            required={required} 
            minLength={minLength} />
        {help && <div className="help-block" id="comment_content_help" >{help}</div>}

    </div>
})