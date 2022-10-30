import { render, unmountComponentAtNode } from "react-dom"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useFetch, usePaginatedFetch } from "../hooks/Hooks"
import { Icon } from "../components/Icon"
import { Field } from "../components/Form"

const dateFormat = {
    dateStyle: "medium",
    timeStyle: "short"
}

const VIEW = "VIEW"

const EDIT = "EDIT"

function Comments({ post, user }) {
    const { items: comments, load, loading, count, hasMore, setItems: setComments } = usePaginatedFetch("/api/comments?post=" + post)

    const addComment = useCallback(comment => {
        setComments(comments => [comment, ...comments])
    }, [])

    const deleteComment = useCallback(comment => {
        setComments(comments => comments.filter(c => c != comment))
    }, [])

    const updateComment = useCallback((newComment, oldComment) => {
        setComments(comments => comments.map(c => c === oldComment ? newComment : c))
    })


    useEffect(() => {
        load()
    }, [])

    return <div>
        <Title count={count} />

        {user && <CommentForm post={post} onComment={addComment} />}
        {comments.map(comment =>
            <Comment key={comment.id}
                comment={comment}
                canEdit={comment.author.id == user}
                onDelete={deleteComment}
                onUpdate={updateComment}
            />
        )}

        {loading && "Chargement..."}<br />

        {hasMore && <div onClick={load} disabled={loading} className="btn btn-primary">Charger plus de commentaires</div>}
    </div>
}

function Title({ count }) {
    return <h3>
        <Icon icon="comments" />
        {count} commentaire{count > 1 ? "s" : ""}
    </h3>
}

const Comment = React.memo(({ comment, onDelete, canEdit, onUpdate }) => {
    // Variable
    const date = new Date(comment.publishedAt)

    // Hooks
    const [state, setState] = useState(VIEW)
    const { loading: loadingDelete, load: callDelete } = useFetch(comment["@id"], "DELETE", onDeleteCallback)
    
    // Events
    const onComment = useCallback((newComment) => {
        onUpdate(newComment, comment)
        toggleEdit()
    }, [comment])
    const onDeleteCallback = useCallback(() => {
        onDelete(comment)
    })
    const toggleEdit = useCallback(() => {
        setState(state => state == VIEW ? EDIT : VIEW)
    }, [])

    // render
    return <div className="row post-comment">
        {/* <a name="comment_{{ comment.id }}"></a> */}
        <h4 className="col-sm-3">
            <strong>{comment.author.fullName}</strong>
            commenté le
            <strong>{date.toLocaleString(undefined, dateFormat)}</strong>
        </h4>
        <div className="col-sm-9 text-justify">
            {state == VIEW ? comment.content : <CommentForm comment={comment} onComment={onComment} onCancel={toggleEdit} />} &nbsp;

            {(canEdit && state !== EDIT) &&
                <p>
                    <button className="btn label label-danger" onClick={callDelete.bind(this, null)} disabled={loadingDelete}>
                        <Icon icon="trash" /> Supprimer
                    </button>&nbsp;
                    <button className="btn label label-info" onClick={toggleEdit}>
                        <Icon icon="pencil" /> Editer
                    </button>
                </p>
            }
        </div>
    </div>
})

const CommentForm = React.memo(({ post = null, onComment, comment = null, onCancel = null }) => {
    // variables
    const ref = useRef(null)


    // Events
    const onSuccess = useCallback((comment) => {
        onComment(comment)
        ref.current.value = ''
    }, [ref, onComment])
    const onSubmit = useCallback(e => {
        e.preventDefault()
        load({
            content: ref.current.value,
            post: "/api/posts/" + post
        })
    }, [load, ref, post])
    

    // Hooks
    const method = comment ? "PUT" : "POST";
    const url = comment ? comment["@id"] : "/api/comments"
    const { load, loading, errors, clearErrors } = useFetch(url, method, onSuccess)

    // Effets
    useEffect(() => {
        if (comment && comment.content && ref.current) {
            ref.current.value = comment.content
        }
    }, [comment, ref])

    // render
    return <div id="post-add-comment" className="well">
        {<form onSubmit={onSubmit}>
            <fieldset>
                <legend>
                    <Icon icon="comment" />{comment === null ? "Laisser un commentaire" : "Modifier un commentaire"}
                </legend>
                <Field name="content"
                    help="Les commentaires non conformes à notre code de conduite seront modérés."
                    ref={ref}
                    error={errors['content']}
                    onChange={clearErrors.bind(this, 'content')}
                    required minLength={5} >Votre commentaire</Field>

                <div className="form-group pull-right">
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        <Icon icon="paper-plane" /> {comment === null ? "Envoyer" : "Modifier"}
                    </button>&nbsp;
                    {onCancel && <button className="btn btn-danger" type="cancel" onClick={onCancel}>
                        <Icon icon="cancel" /> Annuler
                    </button>}
                </div>
            </fieldset>
        </form>}
    </div>
})

class CommentsElement extends HTMLElement {

    constructor(){
        super()
        this.observer = null
    }

    connectedCallback() {
        const post = parseInt(this.dataset.post, 10)
        const user = parseInt(this.dataset.user, 10) || null

        if (this.observer === null) {
            this.observer = new IntersectionObserver((entries, observer ) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.target === this) {
                        observer.disconnect()
                        render(<Comments post={post} user={user} />, this)
                    }
                })
            })
        }

        this.observer.observe(this)
    }

    disconnectedCallback() {
        if (this.observer) {
            this.observer.disconnect()
        }
        unmountComponentAtNode(this)
    }
}

customElements.define('post-comments', CommentsElement)